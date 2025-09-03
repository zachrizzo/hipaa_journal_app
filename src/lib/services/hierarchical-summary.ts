import { db } from '@/lib/db';
// import type { Tables } from '@/types/database';
import { generateEntrySummary as aiGenerateEntrySummary, generateCombinedSummary as aiGenerateCombinedSummary } from '@/lib/ai/summarizer'
import { toPlainText } from '@/lib/utils/tiptap-parser'

// Note: Per-entry rule-based generation helpers removed in favor of AI summaries

interface SummaryBullet {
  text: string;
  entryIds: string[];
  timestamp: Date;
  confidence: number;
}

interface SummaryTheme {
  name: string;
  bullets: SummaryBullet[];
  prevalence: number; // 0-1 scale
}

interface SummaryContent {
  bullets: SummaryBullet[];
  themes: SummaryTheme[];
  risks: {
    level: string;
    flags: string[];
    keywords: string[];
  };
  sentiment: {
    overall: number;
    trend: 'improving' | 'stable' | 'declining';
  };
  topics: string[];
  metadata: {
    entryCount: number;
    dateRange: {
      start: Date;
      end: Date;
    };
    wordCount: number;
  };
}

export class HierarchicalSummaryService {
  private static readonly WINDOW_SIZES = {
    WEEK: 7 * 24 * 60 * 60 * 1000,
    MONTH: 30 * 24 * 60 * 60 * 1000,
    QUARTER: 90 * 24 * 60 * 60 * 1000,
  };

  /**
   * Generate summaries for a user's entries
   */
  static async generateSummariesForUser(userId: string): Promise<void> {
    // Generate weekly summaries
    await this.generatePeriodicSummaries(userId, 'WEEK');
  }

  // Rule-based helpers removed; AI summaries are used for content

  /**
   * Generate periodic summaries (weekly, monthly, etc.)
   */
  private static async generatePeriodicSummaries(
    userId: string,
    period: 'WEEK' | 'MONTH' | 'QUARTER'
  ): Promise<void> {
    const windowSize = this.WINDOW_SIZES[period];
    const now = new Date();
    const windowStart = new Date(now.getTime() - windowSize);

    // Fetch entries in the period
    const entries = await db.journalEntry.findMany({
      where: {
        userId,
        status: 'PUBLISHED',
        createdAt: { gte: windowStart, lte: now },
      },
      orderBy: { createdAt: 'asc' },
    });

    if (!entries.length) return;

    // Generate AI summaries per entry (redaction/sanitization handled in summarizer)
    const entrySummaries: { content: { bullets: any[]; themes: any[]; risks: any; sentiment: any; topics: string[]; metadata: any }; entryId: string }[] = []

    for (const entry of entries) {
      try {
        const contentText = toPlainText(entry.content ?? entry.contentHtml ?? '')
        const ai = await aiGenerateEntrySummary(entry.title || '', contentText, entry.mood ?? null, (entry as any).tags || [])
        // Map AI summary into our rule-based structure as bullets/themes minimal placeholder
        entrySummaries.push({
          entryId: entry.id,
          content: {
            bullets: [{ text: ai.summary, entryIds: [entry.id], timestamp: entry.createdAt, confidence: 0.7 }],
            themes: (ai.keyThemes || []).map((t: string) => ({ name: t, bullets: [], prevalence: 0 })),
            risks: { level: 'NONE', flags: [], keywords: [] },
            sentiment: { overall: 0, trend: 'stable' },
            topics: [],
            metadata: { entryCount: 1, dateRange: { start: entry.createdAt, end: entry.createdAt }, wordCount: ai.wordCount },
          }
        })
      } catch (e) {
        // Skip failures but continue
        continue
      }
    }

    if (!entrySummaries.length) return

    // Merge summaries (rule-based aggregation of AI outputs)
    const mergedContent = this.mergeSummaries(entrySummaries as any)

    // Apply salience filtering
    const salientContent = this.applySalienceFiltering(mergedContent, period);

    // Also produce an AI combined overview from AI entry summaries
    try {
      const combined = await aiGenerateCombinedSummary(
        entrySummaries.map(s => ({ entryId: s.entryId, title: '', summary: String(s.content.bullets[0]?.text || '') })),
        period === 'WEEK' ? 'weekly' : period === 'MONTH' ? 'monthly' : 'custom',
        { dateRange: { start: windowStart.toISOString(), end: now.toISOString() } }
      )
    } catch {}

    // Store the periodic summary (would need a new table in production)
  }

  /**
   * Merge multiple summaries into one
   */
  private static mergeSummaries(
    summaries: { content: SummaryContent; entryId: string }[]
  ): SummaryContent {
    const allBullets: SummaryBullet[] = [];
    const themeMap = new Map<string, SummaryBullet[]>();
    const allRiskFlags = new Set<string>();
    let totalSentiment = 0;
    let totalWordCount = 0;
    const allTopics = new Set<string>();
    
    let dateStart = new Date();
    let dateEnd = new Date(0);

    for (const { content, entryId } of summaries) {
      // Collect bullets
      for (const bullet of content.bullets) {
        allBullets.push({
          ...bullet,
          entryIds: [...bullet.entryIds, entryId],
        });
      }

      // Merge themes
      for (const theme of content.themes) {
        if (!themeMap.has(theme.name)) {
          themeMap.set(theme.name, []);
        }
        themeMap.get(theme.name)!.push(...theme.bullets);
      }

      // Collect risk flags
      content.risks.flags.forEach(flag => allRiskFlags.add(flag));

      // Aggregate sentiment
      totalSentiment += content.sentiment.overall;

      // Collect topics
      content.topics.forEach(topic => allTopics.add(topic));

      // Update metadata
      totalWordCount += content.metadata.wordCount;
      if (content.metadata.dateRange.start < dateStart) {
        dateStart = content.metadata.dateRange.start;
      }
      if (content.metadata.dateRange.end > dateEnd) {
        dateEnd = content.metadata.dateRange.end;
      }
    }

    // Deduplicate bullets
    const deduplicatedBullets = this.deduplicateBullets(allBullets);

    // Rebuild themes
    const mergedThemes: SummaryTheme[] = [];
    for (const [name, bullets] of themeMap.entries()) {
      mergedThemes.push({
        name,
        bullets: this.deduplicateBullets(bullets),
        prevalence: bullets.length / allBullets.length,
      });
    }

    return {
      bullets: deduplicatedBullets,
      themes: mergedThemes.sort((a, b) => b.prevalence - a.prevalence),
      risks: {
        level: this.calculateOverallRiskLevel(Array.from(allRiskFlags)),
        flags: Array.from(allRiskFlags),
        keywords: [],
      },
      sentiment: {
        overall: totalSentiment / summaries.length,
        trend: this.calculateSentimentTrend(summaries.map(s => s.content.sentiment.overall)),
      },
      topics: Array.from(allTopics),
      metadata: {
        entryCount: summaries.length,
        dateRange: { start: dateStart, end: dateEnd },
        wordCount: totalWordCount,
      },
    };
  }

  /**
   * Remove duplicate bullets based on similarity
   */
  private static deduplicateBullets(bullets: SummaryBullet[]): SummaryBullet[] {
    const unique: SummaryBullet[] = [];
    const seen = new Set<string>();

    for (const bullet of bullets) {
      // Simple deduplication based on normalized text
      const normalized = bullet.text.toLowerCase().replace(/[^a-z0-9]/g, '');
      
      if (!seen.has(normalized)) {
        seen.add(normalized);
        unique.push(bullet);
      } else {
        // Merge entry IDs if duplicate
        const existing = unique.find(b => 
          b.text.toLowerCase().replace(/[^a-z0-9]/g, '') === normalized
        );
        if (existing) {
          existing.entryIds = [...new Set([...existing.entryIds, ...bullet.entryIds])];
        }
      }
    }

    return unique;
  }

  /**
   * Apply salience filtering to keep only important content
   */
  private static applySalienceFiltering(
    content: SummaryContent,
    period: 'WEEK' | 'MONTH' | 'QUARTER'
  ): SummaryContent {
    const maxBullets = {
      WEEK: 10,
      MONTH: 20,
      QUARTER: 30,
    }[period];

    // Score bullets by importance
    const scoredBullets = content.bullets.map(bullet => ({
      bullet,
      score: this.calculateBulletImportance(bullet, content),
    }));

    // Sort by score and take top N
    scoredBullets.sort((a, b) => b.score - a.score);
    const topBullets = scoredBullets.slice(0, maxBullets).map(sb => sb.bullet);

    // Filter themes to only include those with bullets in topBullets
    const bulletTexts = new Set(topBullets.map(b => b.text));
    const filteredThemes = content.themes.map(theme => ({
      ...theme,
      bullets: theme.bullets.filter(b => bulletTexts.has(b.text)),
    })).filter(theme => theme.bullets.length > 0);

    return {
      ...content,
      bullets: topBullets,
      themes: filteredThemes,
    };
  }

  /**
   * Calculate importance score for a bullet
   */
  private static calculateBulletImportance(
    bullet: SummaryBullet,
    context: SummaryContent
  ): number {
    let score = bullet.confidence;

    // Boost for risk-related content
    if (context.risks.level !== 'NONE' && context.risks.level !== 'LOW') {
      const bulletLower = bullet.text.toLowerCase();
      if (context.risks.keywords.some(k => bulletLower.includes(k.toLowerCase()))) {
        score += 0.3;
      }
    }

    // Boost for frequency (appears in multiple entries)
    score += Math.min(bullet.entryIds.length * 0.1, 0.3);

    // Boost for recency
    const daysSince = (Date.now() - bullet.timestamp.getTime()) / (24 * 60 * 60 * 1000);
    score += Math.max(0, (7 - daysSince) * 0.05);

    return score;
  }

  /**
   * Calculate overall risk level from flags
   */
  private static calculateOverallRiskLevel(flags: string[]): string {
    if (flags.includes('SELF_HARM') || flags.includes('VIOLENCE')) return 'HIGH';
    if (flags.includes('SUBSTANCE') || flags.includes('PSYCHOSIS')) return 'MEDIUM';
    if (flags.length > 0) return 'LOW';
    return 'NONE';
  }

  /**
   * Calculate sentiment trend
   */
  private static calculateSentimentTrend(
    sentiments: number[]
  ): 'improving' | 'stable' | 'declining' {
    if (sentiments.length < 2) return 'stable';

    // Simple linear regression
    const n = sentiments.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = sentiments.reduce((a, b) => a + b, 0);
    const sumXY = sentiments.reduce((sum, y, x) => sum + x * y, 0);
    const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);

    if (slope > 0.1) return 'improving';
    if (slope < -0.1) return 'declining';
    return 'stable';
  }
}
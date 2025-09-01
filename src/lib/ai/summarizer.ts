import { ChatOpenAI } from '@langchain/openai'
import { PromptTemplate } from '@langchain/core/prompts'
import { StringOutputParser } from '@langchain/core/output_parsers'
import { sanitizeText } from '@/lib/security/sanitize'

let model: ChatOpenAI | null = null

if (process.env.OPENAI_API_KEY) {
  model = new ChatOpenAI({
    openAIApiKey: process.env.OPENAI_API_KEY,
    modelName: 'gpt-3.5-turbo',
    temperature: 0.3,
    maxTokens: 300
  })
}

const SUMMARY_PROMPT = PromptTemplate.fromTemplate(`
You are a mental health AI assistant that helps create concise, therapeutic summaries of journal entries. 

IMPORTANT GUIDELINES:
- NEVER include specific names, locations, or identifying information
- Focus on emotions, themes, and patterns rather than specific events
- Use professional, therapeutic language
- Keep summaries under 150 words
- Maintain client confidentiality at all times
- If content mentions self-harm or danger, note "CLINICAL REVIEW REQUIRED" at the start

Journal Entry Title: {title}
Journal Entry Content: {content}
Entry Mood (1-10): {mood}
Entry Tags: {tags}

Please create a professional summary that:
1. Identifies key emotional themes
2. Notes any significant mood patterns
3. Highlights personal growth or insights
4. Maintains complete confidentiality
5. Uses therapeutic language appropriate for healthcare settings

Summary:`)

const MOOD_ANALYSIS_PROMPT = PromptTemplate.fromTemplate(`
Analyze the mood and emotional content of this journal entry. Provide insights that would be helpful for mental health tracking.

GUIDELINES:
- Focus on emotional patterns and trends
- Identify coping strategies mentioned
- Note stress indicators or triggers
- Suggest areas for therapeutic focus
- Keep response under 100 words

Title: {title}
Content: {content}
Self-Reported Mood: {mood}/10
Tags: {tags}

Emotional Analysis:`)

interface SummaryOptions {
  includeMoodAnalysis?: boolean
  maxLength?: number
  focusArea?: 'general' | 'therapeutic' | 'progress'
}

export interface SummaryResult {
  summary: string
  moodAnalysis?: string
  wordCount: number
  keyThemes: string[]
  riskFlags: string[]
  generatedAt: Date
}

export async function generateEntrySummary(
  title: string,
  content: string,
  mood: number | null,
  tags: string[],
  options: SummaryOptions = {}
): Promise<SummaryResult> {
  if (!model) {
    throw new Error('OpenAI API key not configured. AI summarization is not available.')
  }

  try {
    // Sanitize inputs
    const cleanTitle = sanitizeText(title)
    const cleanContent = stripHtmlAndSanitize(content)
    const cleanTags = tags.map(tag => sanitizeText(tag))

    // Check for risk indicators
    const riskFlags = detectRiskIndicators(cleanContent)

    // Generate main summary
    const summaryChain = SUMMARY_PROMPT.pipe(model).pipe(new StringOutputParser())
    
    const summary = await summaryChain.invoke({
      title: cleanTitle,
      content: cleanContent,
      mood: mood?.toString() || 'not specified',
      tags: cleanTags.join(', ') || 'none'
    })

    let moodAnalysis: string | undefined

    // Generate mood analysis if requested
    if (options.includeMoodAnalysis) {
      const moodChain = MOOD_ANALYSIS_PROMPT.pipe(model).pipe(new StringOutputParser())
      
      moodAnalysis = await moodChain.invoke({
        title: cleanTitle,
        content: cleanContent,
        mood: mood?.toString() || 'not specified',
        tags: cleanTags.join(', ') || 'none'
      })
    }

    // Extract key themes
    const keyThemes = extractKeyThemes(cleanContent, cleanTags)

    return {
      summary: sanitizeText(summary),
      moodAnalysis: moodAnalysis ? sanitizeText(moodAnalysis) : undefined,
      wordCount: summary.split(' ').length,
      keyThemes,
      riskFlags,
      generatedAt: new Date()
    }
  } catch (error) {
    console.error('Error generating summary:', error)
    throw new Error('Failed to generate summary. Please try again later.')
  }
}

export async function generateProgressSummary(
  entries: Array<{
    title: string
    content: string
    mood: number | null
    tags: string[]
    createdAt: Date
  }>,
  timeframe: 'week' | 'month' | 'quarter'
): Promise<string> {
  if (!model) {
    throw new Error('OpenAI API key not configured. AI summarization is not available.')
  }

  if (entries.length === 0) {
    return 'No journal entries found for the specified timeframe.'
  }

  const PROGRESS_PROMPT = PromptTemplate.fromTemplate(`
    Analyze these journal entries from the past {timeframe} and create a progress summary for a healthcare provider.

    GUIDELINES:
    - Focus on emotional patterns and growth
    - Identify recurring themes
    - Note mood trends
    - Highlight coping strategies
    - Maintain complete confidentiality
    - Keep under 200 words

    Entries Summary:
    {entriesSummary}

    Average Mood: {avgMood}/10
    Most Common Tags: {commonTags}
    Entry Count: {entryCount}

    Progress Summary:`)

  try {
    // Prepare data
    const avgMood = entries.reduce((sum, entry) => sum + (entry.mood || 5), 0) / entries.length
    const allTags = entries.flatMap(entry => entry.tags)
    const tagCounts = allTags.reduce((acc, tag) => {
      acc[tag] = (acc[tag] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    const commonTags = Object.entries(tagCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([tag]) => tag)

    const entriesSummary = entries
      .slice(0, 10) // Limit to avoid token limits
      .map(entry => `Title: ${sanitizeText(entry.title)}, Mood: ${entry.mood || 'N/A'}/10`)
      .join('\n')

    const progressChain = PROGRESS_PROMPT.pipe(model).pipe(new StringOutputParser())
    
    const summary = await progressChain.invoke({
      timeframe,
      entriesSummary,
      avgMood: avgMood.toFixed(1),
      commonTags: commonTags.join(', ') || 'none',
      entryCount: entries.length
    })

    return sanitizeText(summary)
  } catch (error) {
    console.error('Error generating progress summary:', error)
    throw new Error('Failed to generate progress summary.')
  }
}

function stripHtmlAndSanitize(html: string): string {
  // Remove HTML tags
  const text = html.replace(/<[^>]*>/g, ' ')
  // Clean up whitespace
  const cleaned = text.replace(/\s+/g, ' ').trim()
  // Sanitize and limit length
  return sanitizeText(cleaned).substring(0, 5000)
}

function detectRiskIndicators(content: string): string[] {
  const riskKeywords = [
    'suicide', 'kill myself', 'end my life', 'want to die',
    'self harm', 'cutting', 'hurting myself',
    'abuse', 'violence', 'threatening',
    'overdose', 'pills', 'weapon'
  ]

  const flags: string[] = []
  const lowerContent = content.toLowerCase()

  for (const keyword of riskKeywords) {
    if (lowerContent.includes(keyword)) {
      flags.push('CLINICAL_REVIEW_REQUIRED')
      break
    }
  }

  return flags
}

function extractKeyThemes(content: string, tags: string[]): string[] {
  const themes = new Set<string>()

  // Add explicit tags
  tags.forEach(tag => themes.add(tag))

  // Extract themes from content
  const themeKeywords = {
    'anxiety': ['anxious', 'worried', 'nervous', 'panic', 'stress'],
    'depression': ['sad', 'down', 'hopeless', 'empty', 'depressed'],
    'relationships': ['family', 'friend', 'partner', 'relationship', 'social'],
    'work': ['job', 'work', 'career', 'boss', 'colleague'],
    'health': ['health', 'medical', 'doctor', 'illness', 'pain'],
    'growth': ['learn', 'growth', 'improve', 'progress', 'better'],
    'gratitude': ['grateful', 'thankful', 'appreciate', 'blessed', 'happy'],
    'challenges': ['difficult', 'hard', 'struggle', 'challenge', 'problem']
  }

  const lowerContent = content.toLowerCase()

  Object.entries(themeKeywords).forEach(([theme, keywords]) => {
    if (keywords.some(keyword => lowerContent.includes(keyword))) {
      themes.add(theme)
    }
  })

  return Array.from(themes).slice(0, 5)
}

export function validateSummaryContent(summary: string): boolean {
  // Check for potentially identifying information
  const identifierPatterns = [
    /\b\d{3}-\d{3}-\d{4}\b/, // Phone numbers
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Emails
    /\b\d{1,5}\s+[\w\s]+(?:street|st|avenue|ave|road|rd|drive|dr|lane|ln|blvd|boulevard)\b/i, // Addresses
    /\b[A-Z][a-z]+ [A-Z][a-z]+\b/ // Potential names (basic check)
  ]

  return !identifierPatterns.some(pattern => pattern.test(summary))
}
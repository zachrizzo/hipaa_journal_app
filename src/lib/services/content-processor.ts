import { toPlainText } from '@/lib/utils/tiptap-parser'
import { SyncRedactor } from 'redact-pii'
import DOMPurify from 'isomorphic-dompurify'
import crypto from 'crypto'

/**
 * PRODUCTION NOTE: For production environments, consider using Google Cloud DLP API
 * instead of the local redact-pii library for more comprehensive PHI/PII detection.
 * 
 * Google Cloud DLP provides:
 * - HIPAA-compliant infrastructure
 * - More comprehensive detection patterns
 * - Regular updates for new PII patterns
 * - Support for multiple languages
 * - Confidence scoring for detected entities
 * - Custom info type detectors
 * 
 * Example implementation:
 * ```typescript
 * import { DlpServiceClient } from '@google-cloud/dlp';
 * const dlp = new DlpServiceClient();
 * 
 * async function redactWithDLP(text: string) {
 *   const request = {
 *     parent: `projects/${projectId}/locations/global`,
 *     item: { value: text },
 *     inspectConfig: {
 *       infoTypes: [
 *         { name: 'PERSON_NAME' },
 *         { name: 'PHONE_NUMBER' },
 *         { name: 'EMAIL_ADDRESS' },
 *         { name: 'US_HEALTHCARE_NPI' },
 *         { name: 'MEDICAL_RECORD_NUMBER' },
 *         // Add more as needed
 *       ],
 *       minLikelihood: 'LIKELY',
 *     },
 *     deidentifyConfig: {
 *       infoTypeTransformations: {
 *         transformations: [{
 *           primitiveTransformation: {
 *             replaceConfig: {
 *               newValue: { stringValue: '[REDACTED]' },
 *             },
 *           },
 *         }],
 *       },
 *     },
 *   };
 *   const [response] = await dlp.deidentifyContent(request);
 *   return response.item?.value || text;
 * }
 * ```
 */


export interface ProcessedContent {
  normalizedText: string;
  contentHash: string;
}

export class ContentProcessor {
  /**
   * Convert mixed input to plain text, sanitize, redact, apply prompt safety, and truncate
   */
  static prepareForAI(
    input: unknown,
    options: { maxLength?: number } = {}
  ): { text: string; contentHash: string } {
    const { maxLength = 2000 } = options
    const plain = toPlainText(input)
    const sanitized = this.sanitizeText(plain)
    const redacted = this.redactText(sanitized)
    const safe = this.safeForAI(redacted)
    const truncated = safe.length > maxLength ? safe.substring(0, maxLength) + '...' : safe
    const contentHash = this.computeHash(this.normalizeForHash(redacted))
    return { text: truncated, contentHash }
  }

  /** Sanitize for XSS */
  static sanitizeText(text: string): string {
    return DOMPurify.sanitize(text, {
      ALLOWED_TAGS: [],
      KEEP_CONTENT: true
    })
  }

  /** Redact PHI/PII */
  static redactText(text: string): string {
    return redactor.redact(text)
  }

  /** Prompt-safety scrubbing, scoped to AI inputs only */
  static safeForAI(text: string): string {
    return text
      .replace(/\b(ignore|disregard)\b\s+(all|previous|above)/gi, '[BLOCKED]')
      .replace(/\bnew\b\s+(instructions|system|prompt)/gi, '[BLOCKED]')
      .replace(/\byou\s+are\s+now\b/gi, '[BLOCKED]')
      .replace(/\bforget\s+everything\b/gi, '[BLOCKED]')
      .replace(/\[INST\][\s\S]*?\[\/INST\]/gi, '[BLOCKED]')
      .replace(/\bsystem\s*:/gi, '[BLOCKED]')
      .replace(/\bassistant\s*:/gi, '[BLOCKED]')
  }

  /**
   * Process journal entry content - TipTap JSON is the single source of truth
   */
  static async processEntry(
    content: Record<string, unknown>, // TipTap JSON (single source of truth)
    _contentHtml: string
  ): Promise<ProcessedContent> {
    const { text, contentHash } = this.prepareForAI(content, { maxLength: 2000 })

    return {
      normalizedText: text,
      contentHash,
    }
  }

  /**
   * Compute SHA-256 hash of content
   */
  private static computeHash(text: string): string {
    return crypto.createHash('sha256').update(text).digest('hex')
  }

  /**
   * Normalize text for stable hashing (collapse whitespace, trim)
   */
  private static normalizeForHash(text: string): string {
    return text.replace(/\s+/g, ' ').trim()
  }

}

// Initialize a shared, comprehensive PHI/PII redactor
// NOTE: In production, replace with Google Cloud DLP API for better accuracy
const redactor = new SyncRedactor()
# PHI/PII Redaction Strategy

## Current Implementation

The application currently uses the `redact-pii` npm package (v3.4.0) for local PHI/PII redaction. This provides basic protection for:
- Names
- Email addresses
- Phone numbers
- Social Security Numbers
- Credit card numbers
- IP addresses

Additionally, we've implemented custom regex patterns for healthcare-specific data:
- Medical Record Numbers (MRN)
- Healthcare provider names
- Physical addresses

## Production Recommendation: Google Cloud DLP API

For production deployments handling real patient data, we strongly recommend migrating to **Google Cloud Data Loss Prevention (DLP) API**.

### Why Google Cloud DLP?

1. **HIPAA Compliance**
   - Google Cloud Platform offers BAA (Business Associate Agreement)
   - Infrastructure meets HIPAA security requirements
   - Detailed audit logs for compliance

2. **Superior Detection**
   - Pre-trained ML models for healthcare data
   - Built-in detectors for healthcare identifiers:
     - National Provider Identifier (NPI)
     - DEA numbers
     - Medical license numbers
     - Insurance policy numbers
   - Confidence scoring for each detection
   - Context-aware detection (reduces false positives)

3. **Continuous Updates**
   - Google maintains and updates detection patterns
   - New PHI patterns added automatically
   - No need to maintain regex patterns

4. **Scalability**
   - Handles large volumes of data
   - Batch processing capabilities
   - Streaming detection for real-time redaction

## Migration Guide

### Step 1: Set Up Google Cloud Project

```bash
# Install Google Cloud SDK
brew install google-cloud-sdk

# Initialize and authenticate
gcloud init
gcloud auth application-default login
```

### Step 2: Enable DLP API

```bash
gcloud services enable dlp.googleapis.com
```

### Step 3: Install Dependencies

```bash
npm install @google-cloud/dlp
```

### Step 4: Create Service Account

```bash
# Create service account
gcloud iam service-accounts create dlp-redactor \
    --display-name="DLP Redactor Service"

# Grant necessary permissions
gcloud projects add-iam-policy-binding PROJECT_ID \
    --member="serviceAccount:dlp-redactor@PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/dlp.user"

# Generate key file
gcloud iam service-accounts keys create dlp-key.json \
    --iam-account=dlp-redactor@PROJECT_ID.iam.gserviceaccount.com
```

### Step 5: Implement DLP Client

Create `src/lib/services/dlp-redactor.ts`:

```typescript
import { DlpServiceClient } from '@google-cloud/dlp';

class DLPRedactor {
  private client: DlpServiceClient;
  private projectId: string;

  constructor() {
    this.client = new DlpServiceClient();
    this.projectId = process.env.GCP_PROJECT_ID!;
  }

  async redactText(text: string): Promise<string> {
    const request = {
      parent: `projects/${this.projectId}/locations/global`,
      item: { value: text },
      inspectConfig: {
        infoTypes: [
          // Standard PII
          { name: 'PERSON_NAME' },
          { name: 'EMAIL_ADDRESS' },
          { name: 'PHONE_NUMBER' },
          { name: 'US_SOCIAL_SECURITY_NUMBER' },
          
          // Healthcare-specific
          { name: 'US_HEALTHCARE_NPI' },
          { name: 'US_DEA_NUMBER' },
          { name: 'MEDICAL_RECORD_NUMBER' },
          { name: 'US_DRIVERS_LICENSE_NUMBER' },
          { name: 'DATE_OF_BIRTH' },
          
          // Location data
          { name: 'STREET_ADDRESS' },
          { name: 'LOCATION' },
        ],
        customInfoTypes: [
          {
            infoType: { name: 'MEDICAL_RECORD_NUMBER' },
            regex: { pattern: '\\b(?:MRN|Medical Record Number)[\\s:#]*[\\w\\d-]+' },
            likelihood: 'LIKELY',
          },
          {
            infoType: { name: 'PROVIDER_NAME' },
            regex: { pattern: '\\b(?:Dr\\.|Doctor|Physician)\\s+[A-Z][a-z]+(?:\\s+[A-Z][a-z]+)?' },
            likelihood: 'POSSIBLE',
          },
        ],
        minLikelihood: 'POSSIBLE',
      },
      deidentifyConfig: {
        infoTypeTransformations: {
          transformations: [
            {
              infoTypes: [
                { name: 'PERSON_NAME' },
                { name: 'PROVIDER_NAME' },
              ],
              primitiveTransformation: {
                replaceConfig: {
                  newValue: { stringValue: '[NAME]' },
                },
              },
            },
            {
              infoTypes: [
                { name: 'EMAIL_ADDRESS' },
              ],
              primitiveTransformation: {
                replaceConfig: {
                  newValue: { stringValue: '[EMAIL]' },
                },
              },
            },
            {
              infoTypes: [
                { name: 'PHONE_NUMBER' },
              ],
              primitiveTransformation: {
                replaceConfig: {
                  newValue: { stringValue: '[PHONE]' },
                },
              },
            },
            {
              infoTypes: [
                { name: 'STREET_ADDRESS' },
                { name: 'LOCATION' },
              ],
              primitiveTransformation: {
                replaceConfig: {
                  newValue: { stringValue: '[ADDRESS]' },
                },
              },
            },
            {
              infoTypes: [
                { name: 'MEDICAL_RECORD_NUMBER' },
                { name: 'US_HEALTHCARE_NPI' },
                { name: 'US_DEA_NUMBER' },
              ],
              primitiveTransformation: {
                replaceConfig: {
                  newValue: { stringValue: '[MEDICAL_ID]' },
                },
              },
            },
          ],
        },
      },
    };

    const [response] = await this.client.deidentifyContent(request);
    return response.item?.value || text;
  }

  async inspectText(text: string): Promise<any> {
    // Use for debugging - shows what DLP detects
    const request = {
      parent: `projects/${this.projectId}/locations/global`,
      item: { value: text },
      inspectConfig: {
        infoTypes: [
          { name: 'PERSON_NAME' },
          { name: 'EMAIL_ADDRESS' },
          { name: 'PHONE_NUMBER' },
          { name: 'US_HEALTHCARE_NPI' },
        ],
        includeQuote: true,
        minLikelihood: 'POSSIBLE',
      },
    };

    const [response] = await this.client.inspectContent(request);
    return response.result;
  }
}

export const dlpRedactor = new DLPRedactor();
```

### Step 6: Update Environment Variables

Add to `.env.local`:

```bash
GCP_PROJECT_ID=your-project-id
GOOGLE_APPLICATION_CREDENTIALS=./dlp-key.json
USE_DLP_REDACTION=true
```

### Step 7: Create Abstraction Layer

Update `content-processor.ts` to switch between local and DLP:

```typescript
import { dlpRedactor } from './dlp-redactor';
import { SyncRedactor } from 'redact-pii';

async function redactContent(text: string): Promise<string> {
  if (process.env.USE_DLP_REDACTION === 'true') {
    // Production: Use Google Cloud DLP
    return await dlpRedactor.redactText(text);
  } else {
    // Development: Use local redactor
    const localRedactor = new SyncRedactor();
    return applyAdditionalRedactions(localRedactor.redact(text));
  }
}
```

## Testing Strategy

1. **Unit Tests**: Test redaction patterns with known PHI samples
2. **Integration Tests**: Verify DLP API integration
3. **Compliance Tests**: Validate against HIPAA requirements
4. **Performance Tests**: Ensure acceptable latency

## Cost Considerations

Google Cloud DLP pricing:
- **Inspection**: $0.50 per GB after 1 GB free tier
- **De-identification**: $0.60 per GB
- **Storage**: Additional if using DLP storage

For a typical healthcare journal app:
- Estimated 10,000 entries/month × 2KB average = 20MB
- Monthly cost: ~$0.01 (well within free tier)

## Security Best Practices

1. **Never log unredacted content**
2. **Use structured logging with automatic redaction**
3. **Implement field-level encryption for sensitive data**
4. **Regular audits of redaction effectiveness**
5. **Keep redaction patterns updated**
6. **Monitor for false positives/negatives**

## Compliance Checklist

- [ ] BAA signed with Google Cloud
- [ ] DLP API enabled and configured
- [ ] Custom info types for healthcare data
- [ ] Audit logging enabled
- [ ] Regular redaction effectiveness reviews
- [ ] Incident response plan for PHI exposure
- [ ] Employee training on PHI handling

## Resources

- [Google Cloud DLP Documentation](https://cloud.google.com/dlp/docs)
- [Healthcare & Life Sciences DLP Guide](https://cloud.google.com/dlp/docs/healthcare-and-life-sciences)
- [HIPAA Compliance on Google Cloud](https://cloud.google.com/security/compliance/hipaa)
- [DLP API Pricing](https://cloud.google.com/dlp/pricing)
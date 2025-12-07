# API Response Format

This document describes the response format for the `/api/analyze-policy` endpoint.

## Endpoint

**POST** `/api/analyze-policy`

## Request Body

```json
{
  "policyText": "Text extracted from PDF..."
}
```

## Success Response (200 OK)

```json
{
  "success": true,
  "premiumEstimate": {
    "monthlyPremium": 150.00,
    "currency": "USD",
    "confidence": "high",
    "notes": "Premium explicitly stated in policy document"
  },
  "sentences": [
    {
      "sentence": "Pre-existing conditions are not covered under this policy.",
      "color": "#e74c3c",
      "riskLevel": "high"
    },
    {
      "sentence": "Claims must be submitted within 30 days of the incident.",
      "color": "#f39c12",
      "riskLevel": "medium"
    },
    {
      "sentence": "Policyholders have the right to appeal any claim denial.",
      "color": "#27ae60",
      "riskLevel": "favorable"
    }
  ]
}
```

## Response Fields

### Root Level

- **`success`** (boolean): Always `true` for successful responses
- **`premiumEstimate`** (object): Monthly premium estimation data
- **`sentences`** (array): Array of analyzed sentences with color coding

### premiumEstimate Object

- **`monthlyPremium`** (number | null): Estimated monthly premium amount. Can be `null` if premium cannot be determined from the policy text.
- **`currency`** (string | null): Currency code (e.g., "USD", "EUR", "GBP"). Can be `null` if not specified.
- **`confidence`** (string): Confidence level of the premium estimate. One of:
  - `"high"`: Premium is explicitly stated in the policy
  - `"medium"`: Estimated from clear policy details
  - `"low"`: Estimated with limited information or could not be determined
- **`notes`** (string): Brief explanation of how the premium was determined or why it couldn't be estimated

### sentences Array

Each object in the array represents a sentence that has been identified as risky or favorable:

- **`sentence`** (string): The exact sentence text as it appears in the policy document (preserves original formatting, spacing, and capitalization)
- **`color`** (string): Hex color code for highlighting:
  - `"#e74c3c"` - Red (high risk)
  - `"#f39c12"` - Yellow (medium risk)
  - `"#27ae60"` - Green (favorable)
- **`riskLevel`** (string): Risk classification. One of:
  - `"high"`: High risk sentences (exclusions, limitations, penalties, unfavorable terms)
  - `"medium"`: Medium/moderate risk sentences (conditions, requirements, moderate limitations)
  - `"favorable"`: Favorable sentences (benefits, protections, rights, advantages)

## Error Response (400/500)

```json
{
  "error": "Error message describing what went wrong"
}
```

## Example: Premium Not Available

```json
{
  "success": true,
  "premiumEstimate": {
    "monthlyPremium": null,
    "currency": null,
    "confidence": "low",
    "notes": "Premium information not found in policy text"
  },
  "sentences": [
    {
      "sentence": "Coverage includes medical expenses up to $100,000.",
      "color": "#27ae60",
      "riskLevel": "favorable"
    }
  ]
}
```

## Example: Empty Sentences Array

```json
{
  "success": true,
  "premiumEstimate": {
    "monthlyPremium": 200.00,
    "currency": "USD",
    "confidence": "medium",
    "notes": "Estimated based on coverage amounts and deductibles"
  },
  "sentences": []
}
```

## Frontend Usage Example

```javascript
// Fetch API example
const response = await fetch('http://localhost:8000/api/analyze-policy', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    policyText: 'Text from PDF...'
  })
});

const data = await response.json();

if (data.success) {
  // Access premium estimate
  const premium = data.premiumEstimate.monthlyPremium;
  const currency = data.premiumEstimate.currency;
  const confidence = data.premiumEstimate.confidence;
  const notes = data.premiumEstimate.notes;
  
  // Access analyzed sentences
  data.sentences.forEach(sentence => {
    console.log(`Sentence: ${sentence.sentence}`);
    console.log(`Color: ${sentence.color}`);
    console.log(`Risk Level: ${sentence.riskLevel}`);
  });
} else {
  console.error('Error:', data.error);
}
```

## TypeScript Interface (Optional)

```typescript
interface PremiumEstimate {
  monthlyPremium: number | null;
  currency: string | null;
  confidence: 'high' | 'medium' | 'low';
  notes: string;
}

interface AnalyzedSentence {
  sentence: string;
  color: '#e74c3c' | '#f39c12' | '#27ae60';
  riskLevel: 'high' | 'medium' | 'favorable';
}

interface AnalyzePolicyResponse {
  success: true;
  premiumEstimate: PremiumEstimate;
  sentences: AnalyzedSentence[];
}

interface ErrorResponse {
  error: string;
}
```


import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Gemini Service
 * Analyzes insurance policy text to identify risky and favorable sentences
 */

// Note: Create React App only exposes env variables prefixed with REACT_APP_
// IMPORTANT: The variable MUST be named REACT_APP_GOOGLE_API_KEY (not REACT_GOOGLE_API_KEY)
// Create React App filters out variables without the REACT_APP_ prefix, so they won't be accessible
const API_KEY = process.env.REACT_APP_GOOGLE_API_KEY;

if (!API_KEY) {
  console.error('❌ Google API key not found!');
  console.error('📝 If you have REACT_GOOGLE_API_KEY in your .env file, please rename it to REACT_APP_GOOGLE_API_KEY');
  console.error('⚠️  Create React App requires the REACT_APP_ prefix for environment variables to be accessible in the browser.');
}

const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

// Expose listAvailableModels globally for debugging in browser console
if (typeof window !== 'undefined') {
  window.listAvailableModels = async () => {
    if (!genAI) {
      console.error('API key not configured');
      return;
    }
    return await listAvailableModels();
  };
  console.log('💡 Debug: Call listAvailableModels() in console to see available models');
}

/**
 * Lists available models for debugging
 * Call this to see what models are available with your API key
 */
export const listAvailableModels = async () => {
  if (!genAI) {
    throw new Error('Google API key is not configured');
  }
  
  try {
    // Use the REST API directly to list models
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to list models: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Available models:', data);
    
    if (data.models && data.models.length > 0) {
      console.log('Model names:');
      data.models.forEach((model) => {
        console.log(`  - ${model.name}`);
      });
    }
    
    return data;
  } catch (error) {
    console.error('Error listing models:', error);
    throw error;
  }
};

/**
 * Analyzes insurance policy text and identifies risky/favorable sentences
 * @param {string} policyText - The insurance policy text to analyze
 * @returns {Promise<Array>} Array of sentence objects with text and hex color
 */
export const analyzePolicyText = async (policyText) => {
  if (!genAI) {
    throw new Error(
      'Google API key is not configured.\n\n' +
      'Please update your .env file:\n' +
      '❌ Change: REACT_GOOGLE_API_KEY=...\n' +
      '✅ To:     REACT_APP_GOOGLE_API_KEY=...\n\n' +
      'Then restart your development server (npm start)'
    );
  }

  if (!policyText || policyText.trim().length === 0) {
    throw new Error('Policy text is empty');
  }

  const prompt = `You are an expert insurance policy analyst. Analyze the following insurance policy text and identify sentences that pose risks to the policyholder or are favorable to them.

Your task:
1. Identify sentences that pose HIGH RISK to the policyholder (exclusions, limitations, penalties, unfavorable terms) - mark these in RED (#e74c3c)
2. Identify sentences that pose MEDIUM/MODERATE RISK (conditions, requirements, moderate limitations) - mark these in YELLOW (#f39c12)
3. Identify sentences that are FAVORABLE to the policyholder (benefits, protections, rights, advantages) - mark these in GREEN (#27ae60)

Return ONLY a valid JSON array. Each object in the array must have:
- "sentence": The exact sentence text as it appears in the policy (preserve original formatting, spacing, and capitalization)
- "color": The hex color code (#e74c3c for red, #f39c12 for yellow, #27ae60 for green)
- "riskLevel": "high", "medium", or "favorable"

Important:
- Extract the EXACT sentence text as it appears in the document (do not paraphrase or modify)
- Include punctuation and spacing exactly as in the original
- If a sentence spans multiple lines, include it with the line breaks
- Return an empty array [] if no risky or favorable sentences are found
- Ensure the JSON is valid and parseable

Policy text:
${policyText}

Return the JSON array now:`;

  // Try different model names until one works
  const modelNamesToTry = ['gemini-2.0-flash', 'gemini-pro', 'gemini-1.5-pro', 'gemini-1.5-flash'];
  let result;
  let lastError;
  let workingModelName = null;
  
  for (const modelName of modelNamesToTry) {
    try {
      console.log(`Trying model: ${modelName}...`);
      const model = genAI.getGenerativeModel({ model: modelName });
      result = await model.generateContent(prompt);
      workingModelName = modelName;
      console.log(`✅ Successfully using model: ${modelName}`);
      break;
    } catch (err) {
      lastError = err;
      console.warn(`❌ Model ${modelName} failed:`, err.message);
      // Continue to next model
      continue;
    }
  }
  
  if (!result) {
    // None of the models worked
    console.error('❌ All model attempts failed');
    console.error('💡 To see available models, run: listAvailableModels()');
    throw new Error(
      `No working Gemini model found. Tried: ${modelNamesToTry.join(', ')}\n` +
      `Last error: ${lastError?.message || 'Unknown error'}\n\n` +
      `💡 Run listAvailableModels() in browser console to see available models.`
    );
  }

  try {
    const response = await result.response;
    const text = response.text();

    // Extract JSON from the response (might have markdown code blocks)
    let jsonText = text.trim();

    // Remove markdown code blocks if present
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '');
    }

    // Try to parse the JSON
    const sentences = JSON.parse(jsonText.trim());

    if (!Array.isArray(sentences)) {
      throw new Error('Invalid response format: expected an array');
    }

    // Validate and normalize the response
    return sentences.map((item, index) => {
      if (!item.sentence || typeof item.sentence !== 'string') {
        throw new Error(`Invalid sentence at index ${index}: missing or invalid sentence field`);
      }
      if (!item.color || typeof item.color !== 'string') {
        throw new Error(`Invalid color at index ${index}: missing or invalid color field`);
      }

      return {
        sentence: item.sentence.trim(),
        color: item.color,
        riskLevel:
          item.riskLevel ||
          (item.color === '#e74c3c'
            ? 'high'
            : item.color === '#f39c12'
            ? 'medium'
            : 'favorable'),
      };
    });
  } catch (error) {
    console.error('Error analyzing policy text with Gemini:', error);
    
    // Provide helpful error message for model not found
    if (error.message && (error.message.includes('not found') || error.message.includes('404'))) {
      console.error('\n💡 Model not found error detected!');
      console.error('   This usually means:');
      console.error('   1. The model name is incorrect for your API key');
      console.error('   2. Your API key doesn\'t have access to this model');
      console.error('   3. The model name format might be different');
      console.error('\n   🔍 To find available models, open browser console and run:');
      console.error('   listAvailableModels()');
      console.error('\n   This will show you which models your API key can access.');
    }
    
    if (error.response) {
      console.error('Gemini API response:', error.response);
    }
    
    // Provide a more helpful error message
    let errorMessage = `Failed to analyze policy text: ${error.message}`;
    if (error.message && error.message.includes('not found')) {
      errorMessage += '\n\n💡 Tip: Open browser console and run listAvailableModels() to see available models.';
    }
    
    throw new Error(errorMessage);
  }
};


/**
 * Policy Analysis Service
 * Sends policy text to backend server for analysis
 */

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';

/**
 * Analyzes insurance policy text by sending it to backend server
 * @param {string} policyText - The insurance policy text to analyze
 * @returns {Promise<Object>} Object containing success, premiumEstimate, and sentences
 */
export const analyzePolicyText = async (policyText) => {
  console.log('🔵 [analyzePolicyText] Starting policy analysis...');
  console.log('🔵 [analyzePolicyText] Policy text length:', policyText?.length || 0);

  if (!policyText || policyText.trim().length === 0) {
    console.error('❌ [analyzePolicyText] Policy text is empty');
    throw new Error('Policy text is empty');
  }

  const apiEndpoint = `${BACKEND_URL}/api/analyze-policy`;
  console.log('🔵 [analyzePolicyText] Backend URL:', apiEndpoint);

  try {
    console.log('🔵 [analyzePolicyText] Sending request to backend...');
    console.log('🔵 [analyzePolicyText] Request payload size:', JSON.stringify({ text: policyText }).length, 'bytes');
    
    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: policyText,
      }),
    });

    console.log('🔵 [analyzePolicyText] Response status:', response.status);
    console.log('🔵 [analyzePolicyText] Response ok:', response.ok);
    console.log('🔵 [analyzePolicyText] Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [analyzePolicyText] Backend error response:', errorText);
      throw new Error(`Backend API error: ${response.status} ${response.statusText}`);
    }

    console.log('🔵 [analyzePolicyText] Parsing JSON response...');
    const data = await response.json();
    
    console.log('✅ [analyzePolicyText] Received response from backend:');
    console.log('📋 [analyzePolicyText] Full response:', JSON.stringify(data, null, 2));
    
    // Validate response structure
    if (!data || typeof data !== 'object') {
      console.error('❌ [analyzePolicyText] Invalid response format:', typeof data);
      throw new Error('Invalid response format: expected an object');
    }

    if (!data.success) {
      console.error('❌ [analyzePolicyText] Backend returned success: false');
      throw new Error('Backend analysis failed');
    }

    if (!Array.isArray(data.sentences)) {
      console.error('❌ [analyzePolicyText] Sentences is not an array:', typeof data.sentences);
      throw new Error('Invalid response format: sentences must be an array');
    }

    console.log('🔵 [analyzePolicyText] Response contains', data.sentences.length, 'sentences');
    
    if (data.premiumEstimate) {
      console.log('💰 [analyzePolicyText] Premium estimate found:', data.premiumEstimate);
    }

    // Validate and normalize sentences
    const validatedSentences = data.sentences.map((item, index) => {
      if (!item.sentence || typeof item.sentence !== 'string') {
        console.error(`❌ [analyzePolicyText] Invalid sentence at index ${index}:`, item);
        throw new Error(`Invalid sentence at index ${index}: missing or invalid sentence field`);
      }
      if (!item.color || typeof item.color !== 'string') {
        console.error(`❌ [analyzePolicyText] Invalid color at index ${index}:`, item);
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

    console.log('✅ [analyzePolicyText] Validation complete. Returning', validatedSentences.length, 'sentences');
    console.log('📊 [analyzePolicyText] Sentences breakdown:');
    const colorCounts = validatedSentences.reduce((acc, item) => {
      acc[item.color] = (acc[item.color] || 0) + 1;
      return acc;
    }, {});
    console.log('📊 [analyzePolicyText] Color distribution:', colorCounts);
    
    // Return full response object
    return {
      success: data.success,
      premiumEstimate: data.premiumEstimate || null,
      sentences: validatedSentences,
    };
  } catch (error) {
    console.error('❌ [analyzePolicyText] Error analyzing policy text:', error);
    
    if (error.message && error.message.includes('Failed to fetch')) {
      console.error('❌ [analyzePolicyText] Network error - is backend server running on', BACKEND_URL, '?');
      throw new Error(
        `Failed to connect to backend server at ${BACKEND_URL}.\n` +
        `Please ensure the backend server is running on port 8000.`
      );
    }
    
    throw new Error(`Failed to analyze policy text: ${error.message}`);
  }
};

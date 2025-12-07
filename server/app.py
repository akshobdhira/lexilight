from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import json
import re
import google.generativeai as genai
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Configure Gemini API
API_KEY = os.getenv('GOOGLE_API_KEY')
if not API_KEY:
    raise ValueError("GOOGLE_API_KEY environment variable is not set")

genai.configure(api_key=API_KEY)

# Model names to try in order
MODEL_NAMES = ['gemini-2.5-pro', 'gemini-1.5-pro', 'gemini-1.5-flash']


def get_working_model():
    """Get a working Gemini model"""
    last_error = None
    for model_name in MODEL_NAMES:
        try:
            model = genai.GenerativeModel(model_name)
            return model
        except Exception as e:
            last_error = e
            print(f"Model {model_name} failed: {e}")
            continue
    raise Exception(f"All models failed. Last error: {last_error}")


def estimate_premium(policy_text, model):
    """
    Pipeline 1: Estimate monthly premium from policy text
    """
    # Use first 5000 characters for premium estimation to avoid timeout
    policy_text_sample = policy_text[:5000] if len(policy_text) > 5000 else policy_text
    
    premium_prompt = f"""You are an expert insurance policy analyst. Analyze the following insurance policy text and estimate the monthly premium.

Your task:
- Review the policy text carefully
- Look for premium information, coverage amounts, deductibles, and policy terms
- If premium information is explicitly stated, use that value
- If not explicitly stated, you MUST provide an approximation based on:
  * Coverage type (e.g., Public Liability, Health, Auto, etc.)
  * Coverage limits mentioned in the policy
  * Deductibles or excess amounts
  * Policy type and typical market rates for similar policies in the same region
  * Any other relevant factors mentioned
- You MUST always provide an estimated monthlyPremium value (never null) - even if it's a rough approximation
- Base your estimate on typical market rates for similar insurance policies

Return ONLY a valid JSON object with the following structure:
  {{
    "monthlyPremium": <number - always provide a value, never null>,
    "currency": "<currency code like USD, EUR, INR, etc.>",
    "confidence": "<high|medium|low>",
    "notes": "<brief explanation of how the premium was determined>"
  }}

Important:
- ALWAYS provide a monthlyPremium number - never return null
- Use "high" confidence if premium is explicitly stated in the policy
- Use "medium" confidence if estimated from clear policy details (coverage limits, deductibles, etc.)
- Use "low" confidence if estimated with limited information (just policy type)
- For Public Liability Insurance in India, typical monthly premiums range from ₹500-5000 depending on coverage
- For Health Insurance, typical monthly premiums range from ₹1000-10000 depending on coverage
- Adjust based on coverage limits, deductibles, and policy specifics mentioned
- Keep notes concise (1-2 sentences) explaining your estimation method

Policy text:
{policy_text_sample}

Return the JSON object now:"""
    
    try:
        response = model.generate_content(premium_prompt)
        text = response.text.strip()
        
        # Extract JSON from the response
        json_text = text
        if json_text.startswith('```'):
            json_text = re.sub(r'^```(?:json)?\n?', '', json_text, flags=re.IGNORECASE)
            json_text = re.sub(r'\n?```$', '', json_text, flags=re.IGNORECASE)
        
        # Parse JSON
        try:
            premium_data = json.loads(json_text)
        except json.JSONDecodeError as e:
            # Try to extract JSON from text if it's embedded
            json_match = re.search(r'\{.*\}', json_text, re.DOTALL)
            if json_match:
                premium_data = json.loads(json_match.group())
            else:
                raise ValueError(f"Failed to parse premium JSON: {e}")
        
        # Validate and normalize
        print(f"premium is:    {premium_data}")
        monthly_premium = premium_data.get('monthlyPremium')
        
        # If premium is None, provide a default estimate based on policy type
        if monthly_premium is None:
            # Try to estimate based on policy text keywords
            policy_lower = policy_text_sample.lower()
            if 'public liability' in policy_lower:
                monthly_premium = 2000  # Default for Public Liability in INR
            elif 'health' in policy_lower or 'medical' in policy_lower:
                monthly_premium = 3000  # Default for Health Insurance in INR
            else:
                monthly_premium = 2500  # Generic default
            
            return {
                'monthlyPremium': monthly_premium,
                'currency': premium_data.get('currency', 'INR'),
                'confidence': 'low',
                'notes': 'Estimated using default rates for policy type (premium not found in document)'
            }
        
        return {
            'monthlyPremium': monthly_premium,
            'currency': premium_data.get('currency', 'INR'),
            'confidence': premium_data.get('confidence', 'low'),
            'notes': premium_data.get('notes', 'Premium estimation completed')
        }
    except Exception as e:
        print(f"Error estimating premium: {str(e)}")
        # Provide a default estimate even on error
        policy_lower = policy_text[:1000].lower() if len(policy_text) > 1000 else policy_text.lower()
        if 'public liability' in policy_lower:
            default_premium = 2000
        elif 'health' in policy_lower or 'medical' in policy_lower:
            default_premium = 3000
        else:
            default_premium = 2500
        
        return {
            'monthlyPremium': default_premium,
            'currency': 'INR',
            'confidence': 'low',
            'notes': f'Default estimate provided due to analysis error: {str(e)}'
        }


def analyze_sentences_chunk(policy_text_chunk, model, chunk_num=1, total_chunks=1):
    """
    Analyze a chunk of policy text for sentences
    """
    chunk_info = f" (Part {chunk_num} of {total_chunks})" if total_chunks > 1 else ""
    
    analysis_prompt = f"""You are an expert insurance policy analyst. Analyze the following insurance policy text{chunk_info} and identify sentences that pose risks to the policyholder or are favorable to them.

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
- Return an empty array [] if no risky or favorable sentences are found in this section
- Ensure the JSON is valid and parseable

Policy text{chunk_info}:
{policy_text_chunk}

Return the JSON array now:"""
    
    try:
        response = model.generate_content(analysis_prompt)
        text = response.text.strip()
        
        # Extract JSON from the response
        json_text = text
        if json_text.startswith('```'):
            json_text = re.sub(r'^```(?:json)?\n?', '', json_text, flags=re.IGNORECASE)
            json_text = re.sub(r'\n?```$', '', json_text, flags=re.IGNORECASE)
        
        # Parse JSON
        try:
            sentences = json.loads(json_text)
        except json.JSONDecodeError as e:
            # Try to extract JSON from text if it's embedded
            json_match = re.search(r'\[.*\]', json_text, re.DOTALL)
            if json_match:
                sentences = json.loads(json_match.group())
            else:
                raise ValueError(f"Failed to parse sentences JSON: {e}")
        
        if not isinstance(sentences, list):
            raise ValueError('Invalid response format: expected an array')
        
        # Validate and normalize the response
        validated_sentences = []
        for item in sentences:
            if not isinstance(item, dict):
                continue
            
            if 'sentence' not in item or not isinstance(item['sentence'], str):
                continue
            
            if 'color' not in item or not isinstance(item['color'], str):
                continue
            
            # Determine risk level if not provided
            risk_level = item.get('riskLevel')
            if not risk_level:
                if item['color'] == '#e74c3c':
                    risk_level = 'high'
                elif item['color'] == '#f39c12':
                    risk_level = 'medium'
                else:
                    risk_level = 'favorable'
            
            validated_sentences.append({
                'sentence': item['sentence'].strip(),
                'color': item['color'],
                'riskLevel': risk_level
            })
        
        return validated_sentences
    except Exception as e:
        print(f"Error analyzing sentences chunk {chunk_num}: {str(e)}")
        return []


def analyze_sentences(policy_text, model):
    """
    Pipeline 2: Analyze and color code sentences by risk level
    Handles long text by splitting into chunks to avoid timeouts
    """
    # Define chunk size (characters) - adjust based on model limits
    # Using 8000 chars per chunk to leave room for prompt
    CHUNK_SIZE = 8000
    text_length = len(policy_text)
    
    # If text is short enough, process in one go
    if text_length <= CHUNK_SIZE:
        return analyze_sentences_chunk(policy_text, model, 1, 1)
    
    # Split text into chunks
    print(f"Text is {text_length} characters, splitting into chunks of {CHUNK_SIZE}...")
    chunks = []
    for i in range(0, text_length, CHUNK_SIZE):
        chunk = policy_text[i:i + CHUNK_SIZE]
        chunks.append(chunk)
    
    total_chunks = len(chunks)
    print(f"Split into {total_chunks} chunks")
    
    # Process each chunk
    all_sentences = []
    for idx, chunk in enumerate(chunks, 1):
        print(f"Processing chunk {idx}/{total_chunks}...")
        try:
            chunk_sentences = analyze_sentences_chunk(chunk, model, idx, total_chunks)
            all_sentences.extend(chunk_sentences)
            print(f"Found {len(chunk_sentences)} sentences in chunk {idx}")
        except Exception as e:
            print(f"Error processing chunk {idx}: {str(e)}")
            # Continue with other chunks even if one fails
            continue
    
    # Remove duplicates (sentences that might appear in multiple chunks)
    seen_sentences = set()
    unique_sentences = []
    for sentence_obj in all_sentences:
        sentence_text = sentence_obj['sentence'].strip()
        if sentence_text and sentence_text not in seen_sentences:
            seen_sentences.add(sentence_text)
            unique_sentences.append(sentence_obj)
    
    print(f"Total unique sentences found: {len(unique_sentences)}")
    return unique_sentences


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'message': 'API is running'}), 200


@app.route('/api/analyze-policy', methods=['POST'])
def analyze_policy():
    """
    Analyze insurance policy text using Gemini LLM
    Pipeline:
    1. Estimate monthly premium
    2. Analyze and color code sentences by risk level
    
    Expected request body:
    {
        "policyText": "text from PDF..."  // or "text": "text from PDF..."
    }
    """
    try:
        # Log request details for debugging
        print(f"Request method: {request.method}")
        print(f"Content-Type: {request.content_type}")
        print(f"Request data (raw): {request.data[:500] if request.data else 'None'}")  # First 500 chars
        
        # Get JSON data from request - use force=True to parse even if Content-Type is not set correctly
        try:
            data = request.get_json(force=True, silent=True)
        except Exception as json_error:
            print(f"Error parsing JSON: {json_error}")
            return jsonify({
                'error': 'Invalid JSON format',
                'details': str(json_error)
            }), 400
        
        print(f"data:     {data}")
        print(f"Parsed JSON data type: {type(data)}")
        print(f"Parsed JSON data keys: {list(data.keys()) if isinstance(data, dict) else 'Not a dict'}")
        
        if not data:
            print("ERROR: No JSON data provided or could not parse JSON")
            return jsonify({
                'error': 'No JSON data provided or invalid JSON format',
                'received_content_type': request.content_type,
                'received_data_preview': str(request.data)[:200] if request.data else 'No data'
            }), 400
        
        if not isinstance(data, dict):
            print(f"ERROR: Data is not a dictionary, it's: {type(data)}")
            return jsonify({
                'error': 'Request body must be a JSON object',
                'received_type': str(type(data))
            }), 400
        
        # Accept both 'text' and 'policyText' keys for flexibility
        policy_text = data.get('policyText') or data.get('text')
        print(f"Policy text received: {'Yes' if policy_text else 'No'} (length: {len(policy_text) if policy_text else 0} characters)")
        
        if not policy_text:
            print("ERROR: policyText or text is missing from request")
            return jsonify({
                'error': 'policyText or text is required and cannot be empty',
                'received_keys': list(data.keys()),
                'hint': 'Please send either "policyText" or "text" field in the request body'
            }), 400
        
        if not isinstance(policy_text, str):
            print(f"ERROR: policyText is not a string, it's: {type(policy_text)}")
            return jsonify({
                'error': 'policyText must be a string',
                'received_type': str(type(policy_text))
            }), 400
        
        if not policy_text.strip():
            print("ERROR: policyText is empty after stripping whitespace")
            return jsonify({
                'error': 'policyText cannot be empty or only whitespace'
            }), 400
        
        # Get working model
        model = get_working_model()
        print(f"Using model for analysis")
        
        # Pipeline 1: Estimate monthly premium
        print("Pipeline 1: Estimating monthly premium...")
        premium_estimate = estimate_premium(policy_text, model)
        print(f"Premium estimate completed: {premium_estimate.get('monthlyPremium')} {premium_estimate.get('currency')}")
        
        # Pipeline 2: Analyze and color code sentences
        print("Pipeline 2: Analyzing sentences...")
        sentences = analyze_sentences(policy_text, model)
        print(f"Sentence analysis completed: {len(sentences)} sentences found")
        
        # Combine both responses
        return jsonify({
            'success': True,
            'premiumEstimate': premium_estimate,
            'sentences': sentences
        }), 200
        
    except Exception as e:
        print(f"Error analyzing policy: {str(e)}")
        return jsonify({
            'error': f'Failed to analyze policy text: {str(e)}'
        }), 500


if __name__ == '__main__':
    port = int(os.getenv('PORT', 8000))
    app.run(host='0.0.0.0', port=port, debug=True)


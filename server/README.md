# Insurance Policy Analysis Backend API

A Flask-based backend API that analyzes insurance policy text using Google's Gemini LLM model to identify risky and favorable sentences.

## Features

- **POST `/api/analyze-policy`**: Analyzes insurance policy text and returns categorized sentences
- **GET `/health`**: Health check endpoint

## Setup

### 1. Install Dependencies

Make sure you have Python 3.7+ installed. Then activate the virtual environment and install dependencies:

```bash
# Activate virtual environment (if using the existing myenv)
source myenv/bin/activate  # On macOS/Linux
# or
myenv\Scripts\activate  # On Windows

# Install dependencies
pip install -r requirements.txt
```

### 2. Configure Environment Variables

Create a `.env` file in the server directory:

```bash
cp .env.example .env
```

Edit `.env` and add your Google Gemini API key:

```
GOOGLE_API_KEY=your_google_api_key_here
PORT=5000
```

You can get a Google API key from [Google AI Studio](https://makersuite.google.com/app/apikey).

### 3. Run the Server

```bash
python app.py
```

The server will start on `http://localhost:5000` (or the port specified in your `.env` file).

## API Endpoints

### POST `/api/analyze-policy`

Analyzes insurance policy text and returns sentences categorized by risk level.

**Request Body:**
```json
{
  "policyText": "Text extracted from PDF..."
}
```

**Response:**
```json
{
  "success": true,
  "sentences": [
    {
      "sentence": "Exact sentence from the policy...",
      "color": "#e74c3c",
      "riskLevel": "high"
    },
    {
      "sentence": "Another sentence...",
      "color": "#f39c12",
      "riskLevel": "medium"
    },
    {
      "sentence": "Favorable sentence...",
      "color": "#27ae60",
      "riskLevel": "favorable"
    }
  ]
}
```

**Risk Levels:**
- `high`: High risk sentences (exclusions, limitations, penalties) - Color: `#e74c3c` (red)
- `medium`: Medium/moderate risk sentences (conditions, requirements) - Color: `#f39c12` (yellow)
- `favorable`: Favorable sentences (benefits, protections, rights) - Color: `#27ae60` (green)

**Error Response:**
```json
{
  "error": "Error message here"
}
```

### GET `/health`

Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "message": "API is running"
}
```

## Example Usage

### Using curl:

```bash
curl -X POST http://localhost:5000/api/analyze-policy \
  -H "Content-Type: application/json" \
  -d '{
    "policyText": "This policy covers medical expenses. However, pre-existing conditions are excluded. The policyholder has the right to appeal any claim denial."
  }'
```

### Using JavaScript (fetch):

```javascript
const response = await fetch('http://localhost:5000/api/analyze-policy', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    policyText: 'Text from PDF...'
  })
});

const data = await response.json();
console.log(data.sentences);
```

## CORS

CORS is enabled for all routes, so the frontend can make requests from any origin. In production, you may want to restrict this to specific origins.

## Notes

- The API automatically tries multiple Gemini models (`gemini-2.0-flash`, `gemini-1.5-pro`, `gemini-1.5-flash`) to find one that works with your API key.
- The response is validated and normalized before being returned.
- Invalid sentences in the response are filtered out automatically.


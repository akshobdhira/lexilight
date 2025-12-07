import React, { useState } from 'react';
import './App.css';
import PDFUpload from './components/PDFUpload';
import HighlightedTextDisplay from './components/HighlightedTextDisplay';
import { extractTextFromPDF } from './utils/pdfParser';
import { analyzePolicyText, listAvailableModels } from './services/geminiService';

function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [extractedText, setExtractedText] = useState('');
  const [highlightRules, setHighlightRules] = useState([]);
  const [error, setError] = useState(null);

  const handleFileSelect = async (file) => {
    setIsLoading(true);
    setError(null);
    setHighlightRules([]);

    try {
      // Step 1: Extract text from PDF
      const text = await extractTextFromPDF(file);
      
      // Print to console as requested
      console.log('=== PDF Text Content ===');
      console.log(text);
      console.log('=== End of PDF Content ===');
      
      setExtractedText(text);
      setIsLoading(false);
      
      // Step 2: Analyze text with Gemini
      setIsAnalyzing(true);
      try {
        // Debug: List available models (uncomment to debug)
        // const availableModels = await listAvailableModels();
        // console.log('Available models:', availableModels);
        
        const analysisResults = await analyzePolicyText(text);
        console.log('=== Gemini Analysis Results ===');
        console.log(analysisResults);
        
        // Convert Gemini results to highlight rules
        const rules = analysisResults.map((result) => ({
          text: result.sentence,
          color: result.color, // Hex color from Gemini
          caseSensitive: false,
        }));
        
        setHighlightRules(rules);
        console.log(`Found ${rules.length} sentences to highlight`);
      } catch (geminiError) {
        console.error('Error analyzing with Gemini:', geminiError);
        setError(`Analysis error: ${geminiError.message}`);
        // Still show the text even if analysis fails
      } finally {
        setIsAnalyzing(false);
      }
    } catch (error) {
      console.error('Error extracting PDF text:', error);
      setError(`Error: ${error.message}`);
      setIsLoading(false);
    }
  };

  // Show upload UI only if no text has been extracted
  if (!extractedText) {
    return (
      <div className="App">
        <div className="app-container">
          <header className="app-header">
            <h1>Simplify your Insurance </h1>
            <p className="app-subtitle">
              Financial documents are technical, we simplify the technicality. 
            </p>
          </header>
          
          <main className="app-main">
            <PDFUpload onFileSelect={handleFileSelect} isLoading={isLoading || isAnalyzing} />
            {isAnalyzing && (
              <div className="status-message loading">
                Analyzing policy text with AI to identify risks and favorable terms...
              </div>
            )}
            {error && (
              <div className="status-message error">
                {error}
              </div>
            )}
          </main>
        </div>
      </div>
    );
  }

  // Show only the extracted text once PDF is read
  return (
    <div className="App text-display">
      <div className="app-container full-width">
        <HighlightedTextDisplay
          text={extractedText}
          highlightRules={highlightRules}
        />
      </div>
    </div>
  );
}

export default App;

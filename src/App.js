import React, { useState } from 'react';
import './App.css';
import PDFUpload from './components/PDFUpload';
import HighlightedTextDisplay from './components/HighlightedTextDisplay';
import PremiumDisplay from './components/PremiumDisplay';
import { extractTextFromPDF } from './utils/pdfParser';
import { analyzePolicyText } from './services/geminiService';

function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [extractedText, setExtractedText] = useState('');
  const [highlightRules, setHighlightRules] = useState([]);
  const [premiumEstimate, setPremiumEstimate] = useState(null);
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
      
      // Step 2: Analyze text with backend API
      console.log('🟢 [App] Starting backend analysis...');
      setIsAnalyzing(true);
      try {
        console.log('🟢 [App] Calling analyzePolicyText...');
        const analysisResponse = await analyzePolicyText(text);
        console.log('🟢 [App] Analysis complete. Full response:', analysisResponse);
        console.log('=== Backend Analysis Results ===');
        console.log(analysisResponse);
        
        // Extract premium estimate
        if (analysisResponse.premiumEstimate) {
          console.log('💰 [App] Setting premium estimate:', analysisResponse.premiumEstimate);
          setPremiumEstimate(analysisResponse.premiumEstimate);
        }
        
        // Convert sentences to highlight rules
        console.log('🟢 [App] Converting sentences to highlight rules...');
        const rules = analysisResponse.sentences.map((result) => ({
          text: result.sentence,
          color: result.color, // Hex color from backend
          caseSensitive: false,
        }));
        
        console.log('🟢 [App] Setting highlight rules:', rules.length, 'rules');
        setHighlightRules(rules);
        console.log(`✅ [App] Found ${rules.length} sentences to highlight`);
      } catch (backendError) {
        console.error('❌ [App] Error analyzing with backend:', backendError);
        setError(`Analysis error: ${backendError.message}`);
        // Still show the text even if analysis fails
      } finally {
        setIsAnalyzing(false);
        console.log('🟢 [App] Analysis process completed');
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
      <PremiumDisplay premiumEstimate={premiumEstimate} />
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

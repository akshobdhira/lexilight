import * as pdfjsLib from 'pdfjs-dist';

// Set worker source for pdf.js
// Try local worker first, fallback to unpkg CDN
if (typeof window !== 'undefined') {
  // Use unpkg CDN with HTTPS - more reliable than cdnjs
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
}

/**
 * Extracts text content from a PDF file
 * @param {File} file - The PDF file to parse
 * @returns {Promise<string>} - The extracted text content
 */
export const extractTextFromPDF = async (file) => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    
    let fullText = '';
    const totalPages = pdf.numPages;
    
    // Extract text from each page, preserving formatting
    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const viewport = page.getViewport({ scale: 1.0 });
      
      // Group text items by lines based on Y position
      const lines = [];
      const lineMap = new Map();
      
      textContent.items.forEach((item) => {
        if (!item.str || !item.transform) return;
        
        const transform = item.transform;
        const y = transform[5]; // Y position
        const x = transform[4]; // X position
        
        // Round Y to group items on the same line (tolerance of 2px)
        const lineKey = Math.round(y / 2) * 2;
        
        if (!lineMap.has(lineKey)) {
          lineMap.set(lineKey, []);
        }
        
        lineMap.get(lineKey).push({
          text: item.str,
          x: x,
          y: y,
          width: item.width || 0,
        });
      });
      
      // Sort lines by Y position (top to bottom)
      const sortedLines = Array.from(lineMap.entries()).sort((a, b) => b[0] - a[0]);
      
      let pageText = '';
      
      sortedLines.forEach(([lineKey, items]) => {
        // Sort items in line by X position (left to right)
        items.sort((a, b) => a.x - b.x);
        
        let lineText = '';
        let lastXEnd = null;
        
        items.forEach((item, index) => {
          // Calculate spacing based on X position difference
          if (lastXEnd !== null) {
            const gap = item.x - lastXEnd;
            
            // If gap is significant (more than 5px), add spaces
            // Convert pixels to approximate spaces (1 space ≈ 4-6px depending on font)
            if (gap > 5) {
              const spaces = Math.max(1, Math.floor(gap / 5));
              lineText += ' '.repeat(spaces);
            } else if (gap > 1) {
              // Small gap, add one space
              lineText += ' ';
            }
          } else {
            // First item in line - add indentation based on X position
            const indent = Math.floor(item.x / 6);
            if (indent > 0) {
              lineText += ' '.repeat(indent);
            }
          }
          
          lineText += item.text;
          lastXEnd = item.x + item.width;
        });
        
        pageText += lineText + '\n';
      });
      
      // Add page break between pages
      if (pageNum < totalPages) {
        fullText += pageText + '\n';
      } else {
        fullText += pageText;
      }
    }
    
    return fullText.trim();
  } catch (error) {
    throw new Error(`Failed to extract text from PDF: ${error.message}`);
  }
};


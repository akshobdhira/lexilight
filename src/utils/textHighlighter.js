/**
 * Text Highlighting Engine
 * Provides flexible text highlighting with multiple colors
 */

export const HIGHLIGHT_COLORS = {
  RED: 'red',
  GREEN: 'green',
  YELLOW: 'yellow',
};

/**
 * Highlight rule configuration
 * @typedef {Object} HighlightRule
 * @property {string} text - The text to highlight
 * @property {string} color - The highlight color (red, green, yellow, or hex color like #e74c3c)
 * @property {boolean} caseSensitive - Whether matching should be case sensitive
 */

/**
 * Creates highlighted text segments from original text and highlight rules
 * @param {string} originalText - The original text to highlight
 * @param {Array<HighlightRule>} highlightRules - Array of highlight rules
 * @returns {Array<Object>} Array of text segments with highlight information
 */
export const createHighlightedSegments = (originalText, highlightRules) => {
  if (!highlightRules || highlightRules.length === 0) {
    return [{ text: originalText, highlighted: false, color: null }];
  }

  // Create a map of all highlight positions
  const highlights = [];
  
  highlightRules.forEach((rule) => {
    // Create a regex pattern that matches the text with flexible whitespace
    // Escape special regex characters in the search text
    const escapedText = rule.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    // Replace spaces in the pattern with \s+ to match any whitespace (including newlines)
    const pattern = escapedText.replace(/\s+/g, '\\s+');
    const flags = rule.caseSensitive ? 'g' : 'gi';
    const regex = new RegExp(pattern, flags);
    
    // Find all matches in the original text
    let match;
    while ((match = regex.exec(originalText)) !== null) {
      highlights.push({
        start: match.index,
        end: match.index + match[0].length,
        color: rule.color,
      });
      
      // Prevent infinite loop on zero-length matches
      if (match[0].length === 0) {
        regex.lastIndex++;
      }
    }
  });

  // Sort highlights by start position
  highlights.sort((a, b) => a.start - b.start);

  // Merge overlapping highlights (later rules take precedence)
  const mergedHighlights = mergeOverlappingHighlights(highlights, originalText);

  // Create segments
  const segments = [];
  let currentIndex = 0;

  mergedHighlights.forEach((highlight) => {
    // Add text before highlight
    if (highlight.start > currentIndex) {
      segments.push({
        text: originalText.substring(currentIndex, highlight.start),
        highlighted: false,
        color: null,
      });
    }

    // Add highlighted text - use original text from the source
    const highlightText = originalText.substring(highlight.start, highlight.end);
    segments.push({
      text: highlightText,
      highlighted: true,
      color: highlight.color,
    });

    currentIndex = highlight.end;
  });

  // Add remaining text after last highlight
  if (currentIndex < originalText.length) {
    segments.push({
      text: originalText.substring(currentIndex),
      highlighted: false,
      color: null,
    });
  }

  return segments.length > 0 ? segments : [{ text: originalText, highlighted: false, color: null }];
};

/**
 * Merges overlapping highlights, keeping the last one when overlaps occur
 * @param {Array<Object>} highlights - Array of highlight objects
 * @param {string} originalText - The original text to extract from
 * @returns {Array<Object>} Merged highlights
 */
const mergeOverlappingHighlights = (highlights, originalText) => {
  if (highlights.length === 0) return [];

  const merged = [];
  let current = { ...highlights[0] };

  for (let i = 1; i < highlights.length; i++) {
    const next = highlights[i];

    if (next.start < current.end) {
      // Overlapping - split and merge
      if (next.start > current.start) {
        // Keep first part of current (non-overlapping)
        merged.push({
          start: current.start,
          end: next.start,
          color: current.color,
        });
      }
      // Use the overlapping part from next (later rule takes precedence)
      current = {
        start: next.start,
        end: Math.max(current.end, next.end),
        color: next.color,
      };
    } else {
      // No overlap - save current and move to next
      merged.push(current);
      current = { ...next };
    }
  }

  merged.push(current);
  return merged;
};

/**
 * Validates highlight rules
 * @param {Array<HighlightRule>} rules - Rules to validate
 * @returns {Object} Validation result with isValid and errors
 */
export const validateHighlightRules = (rules) => {
  if (!Array.isArray(rules)) {
    return { isValid: false, errors: ['Rules must be an array'] };
  }

  const errors = [];
  const validColors = Object.values(HIGHLIGHT_COLORS);

  rules.forEach((rule, index) => {
    if (!rule.text || typeof rule.text !== 'string' || rule.text.trim() === '') {
      errors.push(`Rule ${index + 1}: Text is required and must be a non-empty string`);
    }
    if (!rule.color || !validColors.includes(rule.color)) {
      errors.push(`Rule ${index + 1}: Color must be one of: ${validColors.join(', ')}`);
    }
    if (rule.caseSensitive !== undefined && typeof rule.caseSensitive !== 'boolean') {
      errors.push(`Rule ${index + 1}: caseSensitive must be a boolean`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
};


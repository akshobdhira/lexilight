import React from 'react';
import { createHighlightedSegments } from '../utils/textHighlighter';
import './HighlightedTextDisplay.css';

/**
 * HighlightedTextDisplay Component
 * Displays text with highlighted segments
 */
const HighlightedTextDisplay = ({ text, highlightRules = [] }) => {
  if (!text) {
    return (
      <div className="highlighted-text-container">
        <p className="empty-message">No text to display</p>
      </div>
    );
  }

  const segments = createHighlightedSegments(text, highlightRules);

  return (
    <div className="highlighted-text-container">
      <pre className="highlighted-text-content">
        {segments.map((segment, index) => {
          if (segment.highlighted) {
            // Check if color is a hex color or named color
            const isHexColor = segment.color && segment.color.startsWith('#');
            const style = isHexColor 
              ? { backgroundColor: segment.color, color: '#ffffff' }
              : {};
            const className = isHexColor 
              ? 'highlighted-segment' 
              : `highlighted-segment highlight-${segment.color}`;
            
            return (
              <span
                key={index}
                className={className}
                style={style}
              >
                {segment.text}
              </span>
            );
          }
          return <span key={index}>{segment.text}</span>;
        })}
      </pre>
    </div>
  );
};

export default HighlightedTextDisplay;


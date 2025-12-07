import React, { useState, useEffect } from 'react';
import { createHighlightedSegments } from '../utils/textHighlighter';
import './HighlightedTextDisplay.css';

/**
 * HighlightedTextDisplay Component
 * Displays text with highlighted segments
 */
const HighlightedTextDisplay = ({ text, highlightRules = [] }) => {
  const [activeDropdownIndex, setActiveDropdownIndex] = useState(null);
  const [modifiedText, setModifiedText] = useState(text);

  // Use modified text if available, otherwise use original
  const displayText = modifiedText || text;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.highlighted-segment-wrapper')) {
        setActiveDropdownIndex(null);
      }
    };

    if (activeDropdownIndex !== null) {
      document.addEventListener('click', handleClickOutside);
      return () => {
        document.removeEventListener('click', handleClickOutside);
      };
    }
  }, [activeDropdownIndex]);

  if (!displayText) {
    return (
      <div className="highlighted-text-container">
        <p className="empty-message">No text to display</p>
      </div>
    );
  }

  const segments = createHighlightedSegments(displayText, highlightRules);

  // Generate alternative sentence clause options
  const getClauseOptions = (originalSentence) => {
    // Create clearly different alternative sentences that are contextually relevant
    // These are sample alternatives - in production, these would come from the backend
    
    // Detect sentence type to provide relevant alternatives
    const lowerSentence = originalSentence.toLowerCase();
    let alternatives = [];
    
    if (lowerSentence.includes('exclusion') || lowerSentence.includes('excludes') || lowerSentence.includes('not covered')) {
      // Risk/exclusion sentence - provide inclusive alternatives
      alternatives = [
        {
          id: 1,
          text: 'Coverage includes all standard risks and perils typically associated with this type of policy, with comprehensive protection for the policyholder.',
          label: 'More Inclusive Option',
        },
        {
          id: 2,
          text: 'The policy provides broad coverage subject to standard industry terms and conditions, ensuring adequate protection for common scenarios.',
          label: 'Standard Coverage Option',
        },
        {
          id: 3,
          text: 'Coverage extends to include additional protections beyond the basic policy terms, offering enhanced security for the insured party.',
          label: 'Enhanced Coverage Option',
        },
        {
          id: 4,
          text: 'All reasonable claims will be considered and processed in accordance with standard industry practices and policy guidelines.',
          label: 'Flexible Processing Option',
        },
      ];
    } else if (lowerSentence.includes('shall') || lowerSentence.includes('must') || lowerSentence.includes('required')) {
      // Mandatory requirement - provide optional alternatives
      alternatives = [
        {
          id: 1,
          text: 'The policyholder may choose to comply with these provisions at their discretion, with no mandatory enforcement required.',
          label: 'Optional Compliance Option',
        },
        {
          id: 2,
          text: 'These provisions are recommended but not required, allowing the policyholder flexibility in implementation.',
          label: 'Recommended Option',
        },
        {
          id: 3,
          text: 'The policyholder has the option to follow these guidelines as they see fit, with no penalties for non-compliance.',
          label: 'Flexible Option',
        },
        {
          id: 4,
          text: 'These terms are provided as guidance only, and the policyholder retains full discretion in their application.',
          label: 'Guidance Only Option',
        },
      ];
    } else if (lowerSentence.includes('penalty') || lowerSentence.includes('fine') || lowerSentence.includes('charge')) {
      // Penalty clause - provide softer alternatives
      alternatives = [
        {
          id: 1,
          text: 'In such cases, the policyholder will receive written notification and have an opportunity to address any concerns before any action is taken.',
          label: 'Notification First Option',
        },
        {
          id: 2,
          text: 'The policyholder will be informed of any issues and provided with reasonable time to resolve them without immediate consequences.',
          label: 'Grace Period Option',
        },
        {
          id: 3,
          text: 'Any concerns will be communicated clearly, and the policyholder will have the right to appeal or discuss alternative arrangements.',
          label: 'Appeal Rights Option',
        },
        {
          id: 4,
          text: 'The policyholder will receive advance notice of any potential changes, with options to modify behavior or arrangements accordingly.',
          label: 'Advance Notice Option',
        },
      ];
    } else {
      // Generic alternatives for any other sentence
      alternatives = [
        {
          id: 1,
          text: 'This provision has been revised to provide more favorable terms for the policyholder, with enhanced benefits and protections.',
          label: 'Revised Favorable Option',
        },
        {
          id: 2,
          text: 'The terms have been updated to offer greater flexibility and optional participation, reducing mandatory requirements.',
          label: 'Flexible Terms Option',
        },
        {
          id: 3,
          text: 'Coverage has been expanded to include additional scenarios and protections beyond the original scope of this provision.',
          label: 'Expanded Scope Option',
        },
        {
          id: 4,
          text: 'This clause has been modified to use more neutral language, focusing on cooperation and mutual understanding.',
          label: 'Neutral Language Option',
        },
      ];
    }
    
    return alternatives;
  };

  const handleArrowClick = (segment, index, event) => {
    event.preventDefault();
    event.stopPropagation();
    console.log('🔵 [HighlightedTextDisplay] Arrow clicked for sentence:', segment.text);
    
    // Toggle dropdown
    if (activeDropdownIndex === index) {
      setActiveDropdownIndex(null);
    } else {
      setActiveDropdownIndex(index);
    }
  };

  const handleOptionSelect = (originalSentence, selectedOption, segmentIndex) => {
    console.log('🔵 [HighlightedTextDisplay] Option selected:', selectedOption);
    console.log('🔵 [HighlightedTextDisplay] Original sentence:', originalSentence);
    console.log('🔵 [HighlightedTextDisplay] Replacing with:', selectedOption.text);
    
    // Calculate the exact position of this sentence in the text
    // Build up position by iterating through segments up to the target index
    let currentPosition = 0;
    for (let i = 0; i < segmentIndex; i++) {
      currentPosition += segments[i].text.length;
    }
    
    // Now currentPosition points to the start of our target sentence
    const beforeText = displayText.substring(0, currentPosition);
    const afterText = displayText.substring(currentPosition + originalSentence.length);
    const updatedText = beforeText + selectedOption.text + afterText;
    
    setModifiedText(updatedText);
    setActiveDropdownIndex(null);
    
    console.log('✅ [HighlightedTextDisplay] Text replaced successfully');
    console.log('📝 [HighlightedTextDisplay] New text length:', updatedText.length);
    console.log('📝 [HighlightedTextDisplay] Old sentence length:', originalSentence.length);
    console.log('📝 [HighlightedTextDisplay] New sentence length:', selectedOption.text.length);
  };

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
            
            const clauseOptions = getClauseOptions(segment.text);
            const isDropdownOpen = activeDropdownIndex === index;
            
            return (
              <span key={index} className="highlighted-segment-wrapper">
                <span
                  className={className}
                  style={style}
                >
                  {segment.text}
                </span>
                <span
                  className="highlight-arrow"
                  onClick={(e) => handleArrowClick(segment, index, e)}
                  title="Click to modify this clause"
                >
                  ↓
                </span>
                {isDropdownOpen && (
                  <div className="clause-dropdown" onClick={(e) => e.stopPropagation()}>
                    <div className="dropdown-header">Select alternative clause:</div>
                    {clauseOptions.map((option) => (
                      <div
                        key={option.id}
                        className="dropdown-option"
                        onClick={() => handleOptionSelect(segment.text, option, index)}
                      >
                        <div className="option-label">{option.label}</div>
                        <div className="option-text">{option.text}</div>
                      </div>
                    ))}
                  </div>
                )}
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

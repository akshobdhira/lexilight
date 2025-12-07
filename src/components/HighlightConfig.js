import React, { useState } from 'react';
import { HIGHLIGHT_COLORS, validateHighlightRules } from '../utils/textHighlighter';
import './HighlightConfig.css';

/**
 * HighlightConfig Component
 * Manages highlight rules configuration
 */
const HighlightConfig = ({ highlightRules, onRulesChange }) => {
  const [newRule, setNewRule] = useState({
    text: '',
    color: HIGHLIGHT_COLORS.RED,
    caseSensitive: false,
  });
  const [error, setError] = useState('');

  const handleAddRule = () => {
    setError('');

    if (!newRule.text.trim()) {
      setError('Please enter text to highlight');
      return;
    }

    const updatedRules = [...highlightRules, { ...newRule }];
    const validation = validateHighlightRules(updatedRules);

    if (!validation.isValid) {
      setError(validation.errors[0]);
      return;
    }

    onRulesChange(updatedRules);
    setNewRule({
      text: '',
      color: HIGHLIGHT_COLORS.RED,
      caseSensitive: false,
    });
  };

  const handleRemoveRule = (index) => {
    const updatedRules = highlightRules.filter((_, i) => i !== index);
    onRulesChange(updatedRules);
  };

  const handleColorChange = (index, newColor) => {
    const updatedRules = highlightRules.map((rule, i) =>
      i === index ? { ...rule, color: newColor } : rule
    );
    onRulesChange(updatedRules);
  };

  return (
    <div className="highlight-config-container">
      <h3 className="config-title">Highlight Configuration</h3>
      
      <div className="add-rule-section">
        <div className="input-group">
          <input
            type="text"
            className="text-input"
            placeholder="Enter text to highlight..."
            value={newRule.text}
            onChange={(e) => setNewRule({ ...newRule, text: e.target.value })}
            onKeyPress={(e) => e.key === 'Enter' && handleAddRule()}
          />
          <select
            className="color-select"
            value={newRule.color}
            onChange={(e) => setNewRule({ ...newRule, color: e.target.value })}
          >
            <option value={HIGHLIGHT_COLORS.RED}>Red</option>
            <option value={HIGHLIGHT_COLORS.GREEN}>Green</option>
            <option value={HIGHLIGHT_COLORS.YELLOW}>Yellow</option>
          </select>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={newRule.caseSensitive}
              onChange={(e) =>
                setNewRule({ ...newRule, caseSensitive: e.target.checked })
              }
            />
            Case sensitive
          </label>
          <button className="add-button" onClick={handleAddRule}>
            Add Rule
          </button>
        </div>
        {error && <div className="error-message">{error}</div>}
      </div>

      {highlightRules.length > 0 && (
        <div className="rules-list">
          <h4 className="rules-title">Active Highlight Rules ({highlightRules.length})</h4>
          {highlightRules.map((rule, index) => (
            <div key={index} className="rule-item">
              <div className="rule-content">
                <span className="rule-text">"{rule.text}"</span>
                <select
                  className="rule-color-select"
                  value={rule.color}
                  onChange={(e) => handleColorChange(index, e.target.value)}
                >
                  <option value={HIGHLIGHT_COLORS.RED}>Red</option>
                  <option value={HIGHLIGHT_COLORS.GREEN}>Green</option>
                  <option value={HIGHLIGHT_COLORS.YELLOW}>Yellow</option>
                </select>
                {rule.caseSensitive && (
                  <span className="case-badge">Case Sensitive</span>
                )}
              </div>
              <button
                className="remove-button"
                onClick={() => handleRemoveRule(index)}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HighlightConfig;


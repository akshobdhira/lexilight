import React from 'react';
import './PremiumDisplay.css';

/**
 * PremiumDisplay Component
 * Displays the monthly premium estimate in the top right corner
 */
const PremiumDisplay = ({ premiumEstimate }) => {
  if (!premiumEstimate || !premiumEstimate.monthlyPremium) {
    return null;
  }

  const formatCurrency = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const getConfidenceColor = (confidence) => {
    switch (confidence?.toLowerCase()) {
      case 'high':
        return '#27ae60';
      case 'medium':
        return '#f39c12';
      case 'low':
        return '#e74c3c';
      default:
        return '#666666';
    }
  };

  return (
    <div className="premium-display">
      <div className="premium-label">Monthly Premium</div>
      <div className="premium-amount">
        {formatCurrency(premiumEstimate.monthlyPremium, premiumEstimate.currency)}
      </div>
      {premiumEstimate.confidence && (
        <div 
          className="premium-confidence"
          style={{ color: getConfidenceColor(premiumEstimate.confidence) }}
        >
          {premiumEstimate.confidence.charAt(0).toUpperCase() + premiumEstimate.confidence.slice(1)} confidence
        </div>
      )}
      {premiumEstimate.notes && (
        <div className="premium-notes">{premiumEstimate.notes}</div>
      )}
    </div>
  );
};

export default PremiumDisplay;


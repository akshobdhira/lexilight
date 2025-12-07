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

  const getConfidenceText = (confidence) => {
    switch (confidence?.toLowerCase()) {
      case 'high':
        return 'Great price';
      case 'medium':
        return 'Good price';
      case 'low':
        return 'Estimate';
      default:
        return 'Estimate';
    }
  };

  return (
    <div className="premium-display">
      <div className="premium-label">Monthly Premium</div>
      <div className="premium-amount">
        {formatCurrency(premiumEstimate.monthlyPremium, premiumEstimate.currency)}
      </div>
      {premiumEstimate.confidence && (
        <div className="premium-confidence">
          {getConfidenceText(premiumEstimate.confidence)}
        </div>
      )}
    </div>
  );
};

export default PremiumDisplay;


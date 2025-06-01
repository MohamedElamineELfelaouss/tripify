// File: services/web-react/src/pages/TripRecommendations.js

import React, { useState } from 'react';
import RecommendationForm from '../components/RecommendationForm';
import RecommendationResult from '../components/RecommendationResult';
import './TripRecommendations.css';

const TripRecommendations = () => {
  const [loading, setLoading] = useState(false);
  const [recommendation, setRecommendation] = useState(null);
  const [error, setError] = useState(null);

  const handleFormSubmit = async (formData) => {
    setLoading(true);
    setError(null);

    try {
      // Get token from localStorage (adjust based on your auth implementation)
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      
    //   if (!token) {
    //     throw new Error('Please log in to generate recommendations');
    //   }

      const response = await fetch('/api/v1/recommendations/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to generate recommendation');
      }

      setRecommendation(data.data);
    } catch (err) {
      console.error('Error generating recommendation:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleNewRecommendation = () => {
    setRecommendation(null);
    setError(null);
  };

  return (
    <div className="trip-recommendations-page">
      <div className="container">
        {error && (
          <div className="error-message">
            <div className="error-content">
              <span className="error-icon">⚠️</span>
              <span>{error}</span>
            </div>
            <button 
              className="error-close"
              onClick={() => setError(null)}
            >
              ×
            </button>
          </div>
        )}

        {!recommendation ? (
          <RecommendationForm 
            onSubmit={handleFormSubmit}
            loading={loading}
          />
        ) : (
          <RecommendationResult
            recommendation={recommendation}
            onNewRecommendation={handleNewRecommendation}
          />
        )}
      </div>
    </div>
  );
};

export default TripRecommendations;
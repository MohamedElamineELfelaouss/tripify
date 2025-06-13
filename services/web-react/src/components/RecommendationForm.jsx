// File: services/web-react/src/components/RecommendationForm.js

import React, { useState } from 'react';
// import './RecommendationForm.css';

const RecommendationForm = ({ onSubmit, loading }) => {
  const [formData, setFormData] = useState({
    tripTitle: '',
    destination: '',
    startDate: '',
    endDate: '',
    participants: 1,
    budget: '',
    description: '',
    plannedActivities: ''
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.tripTitle.trim()) {
      newErrors.tripTitle = 'Trip title is required';
    }

    if (!formData.destination.trim()) {
      newErrors.destination = 'Destination is required';
    }

    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    }

    if (!formData.endDate) {
      newErrors.endDate = 'End date is required';
    }

    if (!formData.participants || formData.participants <= 0) {
      newErrors.participants = 'Number of participants must be greater than 0';
    }

    if (!formData.budget || formData.budget <= 0) {
      newErrors.budget = 'Budget must be greater than 0';
    }

    // Date validation
    if (formData.startDate && formData.endDate) {
      const startDate = new Date(formData.startDate);
      const endDate = new Date(formData.endDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (startDate < today) {
        newErrors.startDate = 'Start date cannot be in the past';
      }

      if (endDate <= startDate) {
        newErrors.endDate = 'End date must be after start date';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  // Get minimum date for date inputs (today)
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="recommendation-form">
      <div className="form-header">
        <h2>🤖 AI Trip Planner</h2>
        <p>Let our AI create a personalized trip recommendation for you!</p>
      </div>

      <form onSubmit={handleSubmit} className="form">
        {/* Trip Title */}
        <div className="form-group">
          <label htmlFor="tripTitle" className="form-label">
            Trip Title <span className="required">*</span>
          </label>
          <input
            type="text"
            id="tripTitle"
            name="tripTitle"
            value={formData.tripTitle}
            onChange={handleChange}
            className={`form-input ${errors.tripTitle ? 'error' : ''}`}
            placeholder="e.g., Summer Adventure in Paris"
            disabled={loading}
          />
          {errors.tripTitle && <span className="error-message">{errors.tripTitle}</span>}
        </div>

        {/* Destination */}
        <div className="form-group">
          <label htmlFor="destination" className="form-label">
            Destination <span className="required">*</span>
          </label>
          <input
            type="text"
            id="destination"
            name="destination"
            value={formData.destination}
            onChange={handleChange}
            className={`form-input ${errors.destination ? 'error' : ''}`}
            placeholder="e.g., Paris, France"
            disabled={loading}
          />
          {errors.destination && <span className="error-message">{errors.destination}</span>}
        </div>

        {/* Date Range */}
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="startDate" className="form-label">
              Start Date <span className="required">*</span>
            </label>
            <input
              type="date"
              id="startDate"
              name="startDate"
              value={formData.startDate}
              onChange={handleChange}
              min={today}
              className={`form-input ${errors.startDate ? 'error' : ''}`}
              disabled={loading}
            />
            {errors.startDate && <span className="error-message">{errors.startDate}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="endDate" className="form-label">
              End Date <span className="required">*</span>
            </label>
            <input
              type="date"
              id="endDate"
              name="endDate"
              value={formData.endDate}
              onChange={handleChange}
              min={formData.startDate || today}
              className={`form-input ${errors.endDate ? 'error' : ''}`}
              disabled={loading}
            />
            {errors.endDate && <span className="error-message">{errors.endDate}</span>}
          </div>
        </div>

        {/* Participants and Budget */}
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="participants" className="form-label">
              Participants <span className="required">*</span>
            </label>
            <input
              type="number"
              id="participants"
              name="participants"
              value={formData.participants}
              onChange={handleChange}
              min="1"
              max="20"
              className={`form-input ${errors.participants ? 'error' : ''}`}
              disabled={loading}
            />
            {errors.participants && <span className="error-message">{errors.participants}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="budget" className="form-label">
              Budget (USD) <span className="required">*</span>
            </label>
            <input
              type="number"
              id="budget"
              name="budget"
              value={formData.budget}
              onChange={handleChange}
              min="1"
              step="1"
              className={`form-input ${errors.budget ? 'error' : ''}`}
              placeholder="e.g., 2000"
              disabled={loading}
            />
            {errors.budget && <span className="error-message">{errors.budget}</span>}
          </div>
        </div>

        {/* Description */}
        <div className="form-group">
          <label htmlFor="description" className="form-label">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            className="form-textarea"
            placeholder="Tell us about your ideal trip, preferences, or any special requirements..."
            rows="3"
            disabled={loading}
          />
        </div>

        {/* Planned Activities */}
        <div className="form-group">
          <label htmlFor="plannedActivities" className="form-label">
            Planned Activities
          </label>
          <textarea
            id="plannedActivities"
            name="plannedActivities"
            value={formData.plannedActivities}
            onChange={handleChange}
            className="form-textarea"
            placeholder="Any specific activities you'd like to include? (museums, adventure sports, nightlife, etc.)"
            rows="3"
            disabled={loading}
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className={`submit-button ${loading ? 'loading' : ''}`}
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="spinner"></span>
              Generating Recommendation...
            </>
          ) : (
            '✨ Generate Trip Recommendation'
          )}
        </button>
      </form>
    </div>
  );
};

export default RecommendationForm;
// File: services/web-react/src/components/RecommendationResult.js

import React, { useState } from 'react';
// import './RecommendationResult.css';

const RecommendationResult = ({ recommendation, onNewRecommendation }) => {
  const [activeTab, setActiveTab] = useState('overview');

  if (!recommendation || !recommendation.recommendation) {
    return null;
  }

  const { recommendation: rec, userInput } = recommendation;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const TabButton = ({ id, label, icon }) => (
    <button
      className={`tab-button ${activeTab === id ? 'active' : ''}`}
      onClick={() => setActiveTab(id)}
    >
      <span className="tab-icon">{icon}</span>
      {label}
    </button>
  );

  return (
    <div className="recommendation-result">
      {/* Header */}
      <div className="result-header">
        <div className="result-title">
          <h2>🎯 Your Personalized Trip Plan</h2>
          <p>{rec.tripOverview?.title || userInput.tripTitle}</p>
        </div>
        <button
          className="new-recommendation-btn"
          onClick={onNewRecommendation}
        >
          ✨ Create New Plan
        </button>
      </div>

      {/* Quick Stats */}
      <div className="quick-stats">
        <div className="stat">
          <span className="stat-icon">📍</span>
          <div>
            <div className="stat-value">{rec.tripOverview?.destination || userInput.destination}</div>
            <div className="stat-label">Destination</div>
          </div>
        </div>
        <div className="stat">
          <span className="stat-icon">📅</span>
          <div>
            <div className="stat-value">{rec.tripOverview?.duration || 0} days</div>
            <div className="stat-label">Duration</div>
          </div>
        </div>
        <div className="stat">
          <span className="stat-icon">👥</span>
          <div>
            <div className="stat-value">{userInput.participants}</div>
            <div className="stat-label">Travelers</div>
          </div>
        </div>
        <div className="stat">
          <span className="stat-icon">💰</span>
          <div>
            <div className="stat-value">{formatCurrency(rec.budgetBreakdown?.total || userInput.budget)}</div>
            <div className="stat-label">Total Budget</div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="tab-navigation">
        <TabButton id="overview" label="Overview" icon="📋" />
        <TabButton id="itinerary" label="Itinerary" icon="🗓️" />
        <TabButton id="budget" label="Budget" icon="💰" />
        <TabButton id="recommendations" label="Places" icon="🏨" />
        <TabButton id="tips" label="Tips" icon="💡" />
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="overview-tab">
            <div className="overview-card">
              <h3>Trip Summary</h3>
              <p>{rec.tripOverview?.summary}</p>
              
              {rec.tripOverview?.bestTimeToVisit && (
                <div className="info-item">
                  <strong>Best Time to Visit:</strong> {rec.tripOverview.bestTimeToVisit}
                </div>
              )}
              
              <div className="info-item">
                <strong>Budget per Person:</strong> {formatCurrency(rec.tripOverview?.budgetPerPerson || (userInput.budget / userInput.participants))}
              </div>
            </div>

            {rec.packingList && rec.packingList.length > 0 && (
              <div className="packing-card">
                <h3>📦 Packing List</h3>
                <div className="packing-grid">
                  {rec.packingList.map((item, index) => (
                    <div key={index} className="packing-item">
                      ✓ {item}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Itinerary Tab */}
        {activeTab === 'itinerary' && (
          <div className="itinerary-tab">
            {rec.dailyItinerary && rec.dailyItinerary.map((day) => (
              <div key={day.day} className="day-card">
                <div className="day-header">
                  <h3>Day {day.day}</h3>
                  <div className="day-info">
                    <span className="day-date">{formatDate(day.date)}</span>
                    <span className="day-theme">{day.theme}</span>
                    <span className="day-cost">{formatCurrency(day.totalDayCost || 0)}</span>
                  </div>
                </div>
                
                <div className="activities">
                  {day.activities && day.activities.map((activity, index) => (
                    <div key={index} className="activity">
                      <div className="activity-time">{activity.time}</div>
                      <div className="activity-content">
                        <h4>{activity.activity}</h4>
                        <p className="activity-location">📍 {activity.location}</p>
                        <p className="activity-description">{activity.description}</p>
                        <div className="activity-details">
                          <span className="activity-duration">⏱️ {activity.duration}</span>
                          <span className="activity-cost">{formatCurrency(activity.estimatedCost || 0)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Budget Tab */}
        {activeTab === 'budget' && rec.budgetBreakdown && (
          <div className="budget-tab">
            <div className="budget-overview">
              <h3>Budget Breakdown</h3>
              <div className="budget-total">
                Total: {formatCurrency(rec.budgetBreakdown.total)}
              </div>
            </div>
            
            <div className="budget-categories">
              {Object.entries(rec.budgetBreakdown).map(([category, amount]) => {
                if (category === 'total') return null;
                const percentage = ((amount / rec.budgetBreakdown.total) * 100).toFixed(1);
                
                return (
                  <div key={category} className="budget-item">
                    <div className="budget-item-header">
                      <span className="budget-category">
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </span>
                      <span className="budget-amount">{formatCurrency(amount)}</span>
                    </div>
                    <div className="budget-bar">
                      <div 
                        className="budget-fill" 
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <div className="budget-percentage">{percentage}%</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Recommendations Tab */}
        {activeTab === 'recommendations' && rec.recommendations && (
          <div className="recommendations-tab">
            {/* Accommodation */}
            {rec.recommendations.accommodation && (
              <div className="recommendation-section">
                <h3>🏨 Recommended Accommodation</h3>
                <div className="recommendation-grid">
                  {rec.recommendations.accommodation.map((hotel, index) => (
                    <div key={index} className="recommendation-card">
                      <h4>{hotel.name}</h4>
                      <p className="rec-type">{hotel.type}</p>
                      <p className="rec-location">📍 {hotel.location}</p>
                      <p className="rec-price">{hotel.priceRange}</p>
                      <p className="rec-description">{hotel.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Restaurants */}
            {rec.recommendations.restaurants && (
              <div className="recommendation-section">
                <h3>🍽️ Recommended Restaurants</h3>
                <div className="recommendation-grid">
                  {rec.recommendations.restaurants.map((restaurant, index) => (
                    <div key={index} className="recommendation-card">
                      <h4>{restaurant.name}</h4>
                      <p className="rec-cuisine">{restaurant.cuisine}</p>
                      <p className="rec-price">{restaurant.priceRange}</p>
                      <p className="rec-specialty">⭐ {restaurant.specialty}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Transportation */}
            {rec.recommendations.transportation && (
              <div className="recommendation-section">
                <h3>🚗 Transportation</h3>
                <div className="transport-info">
                  <div className="transport-item">
                    <strong>Getting There:</strong> {rec.recommendations.transportation.gettingThere}
                  </div>
                  <div className="transport-item">
                    <strong>Local Transport:</strong> {rec.recommendations.transportation.localTransport}
                  </div>
                  <div className="transport-item">
                    <strong>Estimated Cost:</strong> {formatCurrency(rec.recommendations.transportation.estimatedCost || 0)}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tips Tab */}
        {activeTab === 'tips' && rec.travelTips && (
          <div className="tips-tab">
            <h3>💡 Travel Tips</h3>
            <div className="tips-list">
              {rec.travelTips.map((tip, index) => (
                <div key={index} className="tip-item">
                  <span className="tip-icon">💡</span>
                  <p>{tip}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecommendationResult;
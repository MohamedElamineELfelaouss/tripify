// File: services/api-node/src/routes/recommendations.js

import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
// You'll need to adjust this import path based on your project structure
// import authMiddleware from '../middleware/auth.js'; // Adjust path as needed

const router = express.Router();

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI("AIzaSyDmWioIMPEg_HY1CrVTFWa5qPrRkUulnzU");

// Validation middleware
const validateRecommendationRequest = (req, res, next) => {
  const { tripTitle, destination, startDate, endDate, participants, budget } = req.body;
  
  const errors = [];
  
  if (!tripTitle || tripTitle.trim().length === 0) {
    errors.push('Trip title is required');
  }
  
  if (!destination || destination.trim().length === 0) {
    errors.push('Destination is required');
  }
  
  if (!startDate) {
    errors.push('Start date is required');
  }
  
  if (!endDate) {
    errors.push('End date is required');
  }
  
  if (!participants || participants <= 0) {
    errors.push('Number of participants must be greater than 0');
  }
  
  if (!budget || budget <= 0) {
    errors.push('Budget must be greater than 0');
  }
  
  // Validate dates
  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start >= end) {
      errors.push('End date must be after start date');
    }
    
    if (start < new Date()) {
      errors.push('Start date cannot be in the past');
    }
  }
  
  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      errors
    });
  }
  
  next();
};

// Simple test endpoint (no auth required)
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Recommendations route is working!',
    timestamp: new Date().toISOString()
  });
});

// Generate trip recommendations
// NOTE: Temporarily removing authMiddleware for testing
router.post('/generate', validateRecommendationRequest, async (req, res) => {
  try {
    const { 
      tripTitle, 
      destination, 
      startDate, 
      endDate, 
      participants, 
      budget, 
      description = '', 
      plannedActivities = '' 
    } = req.body;
    
    // Check if Gemini API key is available
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        success: false,
        message: 'Gemini API key not configured',
        error: 'GEMINI_API_KEY environment variable is missing'
      });
    }
    
    // Calculate trip duration
    const start = new Date(startDate);
    const end = new Date(endDate);
    const duration = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    
    // Create detailed prompt for Gemini
    const prompt = `
You are a professional travel planner. Create a detailed trip recommendation based on the following requirements:

**Trip Details:**
- Title: ${tripTitle}
- Destination: ${destination}
- Duration: ${duration} days (${startDate} to ${endDate})
- Number of participants: ${participants}
- Budget: ${budget} USD total
- Description: ${description || 'No specific description provided'}
- Planned activities: ${plannedActivities || 'Open to suggestions'}

**Please provide a comprehensive trip plan in the following JSON format:**

{
  "tripOverview": {
    "title": "string",
    "destination": "string",
    "duration": "number",
    "budgetPerPerson": "number",
    "bestTimeToVisit": "string",
    "summary": "string"
  },
  "dailyItinerary": [
    {
      "day": 1,
      "date": "YYYY-MM-DD",
      "theme": "string",
      "activities": [
        {
          "time": "HH:MM",
          "activity": "string",
          "location": "string",
          "estimatedCost": "number",
          "duration": "string",
          "description": "string"
        }
      ],
      "totalDayCost": "number"
    }
  ],
  "budgetBreakdown": {
    "accommodation": "number",
    "food": "number",
    "transportation": "number",
    "activities": "number",
    "miscellaneous": "number",
    "total": "number"
  },
  "recommendations": {
    "accommodation": [
      {
        "name": "string",
        "type": "string",
        "priceRange": "string",
        "location": "string",
        "description": "string"
      }
    ],
    "restaurants": [
      {
        "name": "string",
        "cuisine": "string",
        "priceRange": "string",
        "specialty": "string"
      }
    ],
    "transportation": {
      "gettingThere": "string",
      "localTransport": "string",
      "estimatedCost": "number"
    }
  },
  "travelTips": [
    "string"
  ],
  "packingList": [
    "string"
  ]
}

Make sure the recommendations are:
1. Within the specified budget
2. Appropriate for ${participants} people
3. Realistic and achievable
4. Include specific locations and venues when possible
5. Consider local culture and customs
6. Include cost estimates for all activities

Respond ONLY with valid JSON, no additional text.
`;

    // Get recommendation from Gemini
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Parse JSON response
    let recommendation;
    try {
      // Clean the response to ensure it's valid JSON
      const cleanedText = text.replace(/```json\n?|\n?```/g, '').trim();
      recommendation = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', parseError);
      console.error('Raw response:', text);
      
      return res.status(500).json({
        success: false,
        message: 'Failed to parse AI recommendation',
        error: 'Invalid response format from AI service'
      });
    }
    
    // Validate the response has required fields
    if (!recommendation.tripOverview || !recommendation.dailyItinerary) {
      return res.status(500).json({
        success: false,
        message: 'Incomplete recommendation received',
        error: 'AI response missing required fields'
      });
    }
    
    // Save the recommendation request to database (optional)
    // You could save this to your MongoDB for user history
    
    res.json({
      success: true,
      data: {
        requestId: Date.now().toString(), // Simple ID generation
        userInput: {
          tripTitle,
          destination,
          startDate,
          endDate,
          participants,
          budget,
          description,
          plannedActivities
        },
        recommendation,
        generatedAt: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Error generating recommendation:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to generate trip recommendation',
      error: error.message
    });
  }
});

// Get user's recommendation history (optional)
router.get('/history', async (req, res) => {
  try {
    // This would fetch from your database
    // For now, return empty array
    res.json({
      success: true,
      data: []
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recommendation history',
      error: error.message
    });
  }
});

export default router;
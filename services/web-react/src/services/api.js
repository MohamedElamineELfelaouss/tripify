import api from "../lib/api";

// Auth API calls
export const authAPI = {
  login: async (email, password) => {
    const response = await api.post("/users/login", { email, password });
    return response.data;
  },

  register: async (userData) => {
    const response = await api.post("/users/register", userData);
    return response.data;
  },

  logout: async () => {
    const response = await api.post("/users/logout");
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get("/users/profile");
    return response.data;
  },

  updateProfile: async (userData) => {
    const response = await api.put("/users/profile", userData);
    return response.data;
  },

  refreshToken: async () => {
    const response = await api.post("/users/refresh-token");
    return response.data;
  },
};

// Trips API calls
export const tripsAPI = {
  getTrips: async (params = {}) => {
    const response = await api.get("/trips", { params });
    return response.data;
  },

  getTrip: async (id) => {
    const response = await api.get(`/trips/${id}`);
    return response.data;
  },

  createTrip: async (tripData) => {
    const response = await api.post("/trips", tripData);
    return response.data;
  },

  updateTrip: async (id, tripData) => {
    const response = await api.put(`/trips/${id}`, tripData);
    return response.data;
  },

  deleteTrip: async (id) => {
    const response = await api.delete(`/trips/${id}`);
    return response.data;
  },

  searchTrips: async (query) => {
    const response = await api.get("/trips/search", { params: { q: query } });
    return response.data;
  },

  addCollaborator: async (tripId, email) => {
    const response = await api.post(`/trips/${tripId}/collaborators`, {
      email,
    });
    return response.data;
  },

  removeCollaborator: async (tripId, userId) => {
    const response = await api.delete(
      `/trips/${tripId}/collaborators/${userId}`
    );
    return response.data;
  },
};

// External data API calls
export const dataAPI = {
  getFlights: async (params) => {
    const response = await api.get("/data/flights", { params });
    return response.data;
  },

  getHotels: async (params) => {
    const response = await api.get("/data/hotels", { params });
    return response.data;
  },

  getWeather: async (city, countryCode) => {
    const response = await api.get("/data/weather", {
      params: { city, country_code: countryCode },
    });
    return response.data;
  },

  getDestinationImages: async (destination, count = 5) => {
    const response = await api.get("/data/images", {
      params: { destination, count },
    });
    return response.data;
  },

  getExchangeRates: async (baseCurrency, targetCurrencies) => {
    const response = await api.get("/data/exchange-rates", {
      params: {
        base_currency: baseCurrency,
        target_currencies: targetCurrencies.join(","),
      },
    });
    return response.data;
  },

  getDestinationInfo: async (destination) => {
    const response = await api.get("/data/destination-info", {
      params: { destination },
    });
    return response.data;
  },
};

// Analytics API calls
export const analyticsAPI = {
  getTripAnalytics: async (timeRange = "month") => {
    const response = await api.get("/analytics/trips", {
      params: { time_range: timeRange },
    });
    return response.data;
  },

  getUserStats: async () => {
    const response = await api.get("/analytics/user-stats");
    return response.data;
  },
};

// Recommendations API calls
export const recommendationsAPI = {
  getPersonalizedDestinations: async (preferences) => {
    const response = await api.post(
      "/recommendations/destinations",
      preferences
    );
    return response.data;
  },

  getSimilarTrips: async (tripId) => {
    const response = await api.get(`/recommendations/similar-trips/${tripId}`);
    return response.data;
  },

  getTrendingDestinations: async () => {
    const response = await api.get("/recommendations/trending");
    return response.data;
  },
};

// Combined API service for convenience
export const apiService = {
  // Auth methods
  ...authAPI,

  // Trip methods
  ...tripsAPI,

  // Destination methods (using trip data for now)
  getDestinations: async (params = {}) => {
    // For now, use trip data as destination data
    const response = await api.get("/trips", { params });
    return response.data;
  },

  // Recommendations methods
  ...recommendationsAPI,
};

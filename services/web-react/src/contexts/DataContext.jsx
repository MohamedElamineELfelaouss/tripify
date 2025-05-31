import React, { createContext, useContext, useReducer } from 'react';
import { toast } from 'react-hot-toast';
import axios from 'axios';

// Initial state
const initialState = {
  flights: [],
  hotels: [],
  activities: [],
  weather: null,
  currency: null,
  destinations: [],
  isLoading: false,
  error: null,
  cache: {
    flights: new Map(),
    hotels: new Map(),
    activities: new Map(),
    weather: new Map(),
    currency: new Map(),
  },
};

// Data actions
const dataActions = {
  SET_LOADING: 'SET_LOADING',
  SET_FLIGHTS: 'SET_FLIGHTS',
  SET_HOTELS: 'SET_HOTELS',
  SET_ACTIVITIES: 'SET_ACTIVITIES',
  SET_WEATHER: 'SET_WEATHER',
  SET_CURRENCY: 'SET_CURRENCY',
  SET_DESTINATIONS: 'SET_DESTINATIONS',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  SET_CACHE: 'SET_CACHE',
};

// Data reducer
const dataReducer = (state, action) => {
  switch (action.type) {
    case dataActions.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload,
      };

    case dataActions.SET_FLIGHTS:
      return {
        ...state,
        flights: action.payload,
        isLoading: false,
        error: null,
      };

    case dataActions.SET_HOTELS:
      return {
        ...state,
        hotels: action.payload,
        isLoading: false,
        error: null,
      };

    case dataActions.SET_ACTIVITIES:
      return {
        ...state,
        activities: action.payload,
        isLoading: false,
        error: null,
      };

    case dataActions.SET_WEATHER:
      return {
        ...state,
        weather: action.payload,
        isLoading: false,
        error: null,
      };

    case dataActions.SET_CURRENCY:
      return {
        ...state,
        currency: action.payload,
        isLoading: false,
        error: null,
      };

    case dataActions.SET_DESTINATIONS:
      return {
        ...state,
        destinations: action.payload,
        isLoading: false,
        error: null,
      };

    case dataActions.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      };

    case dataActions.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };

    case dataActions.SET_CACHE:
      return {
        ...state,
        cache: {
          ...state.cache,
          [action.payload.type]: action.payload.cache,
        },
      };

    default:
      return state;
  }
};

// Create context
const DataContext = createContext();

// Custom hook to use data context
export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

// Data provider component
export const DataProvider = ({ children }) => {
  const [state, dispatch] = useReducer(dataReducer, initialState);
  // Base API URL for data service
  const DATA_API_BASE = import.meta.env.VITE_DATA_API_URL || 'http://localhost:3001';

  // Helper function to generate cache key
  const generateCacheKey = (params) => {
    return JSON.stringify(params);
  };

  // Helper function to check cache
  const getCachedData = (type, params) => {
    const cacheKey = generateCacheKey(params);
    const cacheEntry = state.cache[type].get(cacheKey);
    
    if (cacheEntry && Date.now() - cacheEntry.timestamp < 5 * 60 * 1000) { // 5 minutes cache
      return cacheEntry.data;
    }
    
    return null;
  };

  // Helper function to set cache
  const setCachedData = (type, params, data) => {
    const cacheKey = generateCacheKey(params);
    const newCache = new Map(state.cache[type]);
    newCache.set(cacheKey, {
      data,
      timestamp: Date.now(),
    });
    
    dispatch({
      type: dataActions.SET_CACHE,
      payload: { type, cache: newCache },
    });
  };

  // Search flights
  const searchFlights = async (searchParams) => {
    try {
      // Check cache first
      const cachedData = getCachedData('flights', searchParams);
      if (cachedData) {
        dispatch({ type: dataActions.SET_FLIGHTS, payload: cachedData });
        return { success: true, data: cachedData };
      }

      dispatch({ type: dataActions.SET_LOADING, payload: true });
      dispatch({ type: dataActions.CLEAR_ERROR });

      const response = await axios.get(`${DATA_API_BASE}/api/external/flights`, {
        params: searchParams,
      });

      const flights = response.data.data || [];
      
      dispatch({ type: dataActions.SET_FLIGHTS, payload: flights });
      setCachedData('flights', searchParams, flights);

      return { success: true, data: flights };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to search flights';
      dispatch({ type: dataActions.SET_ERROR, payload: errorMessage });
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Search hotels
  const searchHotels = async (searchParams) => {
    try {
      // Check cache first
      const cachedData = getCachedData('hotels', searchParams);
      if (cachedData) {
        dispatch({ type: dataActions.SET_HOTELS, payload: cachedData });
        return { success: true, data: cachedData };
      }

      dispatch({ type: dataActions.SET_LOADING, payload: true });
      dispatch({ type: dataActions.CLEAR_ERROR });

      const response = await axios.get(`${DATA_API_BASE}/api/external/hotels`, {
        params: searchParams,
      });

      const hotels = response.data.data || [];
      
      dispatch({ type: dataActions.SET_HOTELS, payload: hotels });
      setCachedData('hotels', searchParams, hotels);

      return { success: true, data: hotels };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to search hotels';
      dispatch({ type: dataActions.SET_ERROR, payload: errorMessage });
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Search activities
  const searchActivities = async (searchParams) => {
    try {
      // Check cache first
      const cachedData = getCachedData('activities', searchParams);
      if (cachedData) {
        dispatch({ type: dataActions.SET_ACTIVITIES, payload: cachedData });
        return { success: true, data: cachedData };
      }

      dispatch({ type: dataActions.SET_LOADING, payload: true });
      dispatch({ type: dataActions.CLEAR_ERROR });

      const response = await axios.get(`${DATA_API_BASE}/api/external/activities`, {
        params: searchParams,
      });

      const activities = response.data.data || [];
      
      dispatch({ type: dataActions.SET_ACTIVITIES, payload: activities });
      setCachedData('activities', searchParams, activities);

      return { success: true, data: activities };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to search activities';
      dispatch({ type: dataActions.SET_ERROR, payload: errorMessage });
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Get weather data
  const getWeather = async (location) => {
    try {
      // Check cache first
      const cachedData = getCachedData('weather', { location });
      if (cachedData) {
        dispatch({ type: dataActions.SET_WEATHER, payload: cachedData });
        return { success: true, data: cachedData };
      }

      dispatch({ type: dataActions.SET_LOADING, payload: true });
      dispatch({ type: dataActions.CLEAR_ERROR });

      const response = await axios.get(`${DATA_API_BASE}/api/external/weather`, {
        params: { location },
      });

      const weather = response.data.data;
      
      dispatch({ type: dataActions.SET_WEATHER, payload: weather });
      setCachedData('weather', { location }, weather);

      return { success: true, data: weather };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to get weather data';
      dispatch({ type: dataActions.SET_ERROR, payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  };

  // Get currency exchange rates
  const getCurrencyRates = async (base = 'USD', target) => {
    try {
      // Check cache first
      const cachedData = getCachedData('currency', { base, target });
      if (cachedData) {
        dispatch({ type: dataActions.SET_CURRENCY, payload: cachedData });
        return { success: true, data: cachedData };
      }

      dispatch({ type: dataActions.SET_LOADING, payload: true });
      dispatch({ type: dataActions.CLEAR_ERROR });

      const response = await axios.get(`${DATA_API_BASE}/api/external/currency`, {
        params: { base, target },
      });

      const currency = response.data.data;
      
      dispatch({ type: dataActions.SET_CURRENCY, payload: currency });
      setCachedData('currency', { base, target }, currency);

      return { success: true, data: currency };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to get currency rates';
      dispatch({ type: dataActions.SET_ERROR, payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  };

  // Search destinations
  const searchDestinations = async (query, options = {}) => {
    try {
      const searchParams = { query, ...options };
      
      // Check cache first
      const cachedData = getCachedData('destinations', searchParams);
      if (cachedData) {
        dispatch({ type: dataActions.SET_DESTINATIONS, payload: cachedData });
        return { success: true, data: cachedData };
      }

      dispatch({ type: dataActions.SET_LOADING, payload: true });
      dispatch({ type: dataActions.CLEAR_ERROR });

      const response = await axios.get(`${DATA_API_BASE}/api/external/destinations`, {
        params: searchParams,
      });

      const destinations = response.data.data || [];
      
      dispatch({ type: dataActions.SET_DESTINATIONS, payload: destinations });
      setCachedData('destinations', searchParams, destinations);

      return { success: true, data: destinations };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to search destinations';
      dispatch({ type: dataActions.SET_ERROR, payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  };

  // Get destination photos
  const getDestinationPhotos = async (destination, count = 10) => {
    try {
      const response = await axios.get(`${DATA_API_BASE}/api/external/photos`, {
        params: { query: destination, count },
      });

      return { success: true, data: response.data.data || [] };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to get photos';
      return { success: false, error: errorMessage };
    }
  };

  // Get comprehensive trip data for a destination
  const getTripData = async (destination, dates = {}) => {
    try {
      dispatch({ type: dataActions.SET_LOADING, payload: true });
      dispatch({ type: dataActions.CLEAR_ERROR });

      // Fetch all relevant data in parallel
      const promises = [
        getWeather(destination),
        searchHotels({ location: destination, ...dates }),
        searchActivities({ location: destination }),
        getDestinationPhotos(destination, 5),
      ];

      if (dates.checkIn && dates.checkOut) {
        promises.push(
          searchFlights({
            destination,
            departureDate: dates.checkIn,
            returnDate: dates.checkOut,
          })
        );
      }

      const results = await Promise.allSettled(promises);
      
      const tripData = {
        weather: results[0].status === 'fulfilled' ? results[0].value.data : null,
        hotels: results[1].status === 'fulfilled' ? results[1].value.data : [],
        activities: results[2].status === 'fulfilled' ? results[2].value.data : [],
        photos: results[3].status === 'fulfilled' ? results[3].value.data : [],
        flights: results[4] && results[4].status === 'fulfilled' ? results[4].value.data : [],
      };

      dispatch({ type: dataActions.SET_LOADING, payload: false });
      return { success: true, data: tripData };
    } catch (error) {
      const errorMessage = 'Failed to fetch comprehensive trip data';
      dispatch({ type: dataActions.SET_ERROR, payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  };

  // Clear all data
  const clearData = () => {
    dispatch({ type: dataActions.SET_FLIGHTS, payload: [] });
    dispatch({ type: dataActions.SET_HOTELS, payload: [] });
    dispatch({ type: dataActions.SET_ACTIVITIES, payload: [] });
    dispatch({ type: dataActions.SET_WEATHER, payload: null });
    dispatch({ type: dataActions.SET_CURRENCY, payload: null });
    dispatch({ type: dataActions.SET_DESTINATIONS, payload: [] });
  };

  // Clear error
  const clearError = () => {
    dispatch({ type: dataActions.CLEAR_ERROR });
  };

  // Clear specific cache
  const clearCache = (type = null) => {
    if (type) {
      dispatch({
        type: dataActions.SET_CACHE,
        payload: { type, cache: new Map() },
      });
    } else {
      // Clear all cache
      Object.keys(state.cache).forEach((cacheType) => {
        dispatch({
          type: dataActions.SET_CACHE,
          payload: { type: cacheType, cache: new Map() },
        });
      });
    }
  };

  const value = {
    // State
    ...state,
    
    // Actions
    searchFlights,
    searchHotels,
    searchActivities,
    getWeather,
    getCurrencyRates,
    searchDestinations,
    getDestinationPhotos,
    getTripData,
    
    // Utilities
    clearData,
    clearError,
    clearCache,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export default DataContext;

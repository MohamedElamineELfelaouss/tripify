import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useAuth } from './AuthContext';
import { tripsAPI } from '../services/api';

// Initial state
const initialState = {
  trips: [],
  currentTrip: null,
  isLoading: false,
  error: null,
  filters: {
    status: 'all',
    destination: '',
    search: '',
    sortBy: 'startDate',
    sortOrder: 'desc',
  },
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  },
};

// Trip actions
const tripActions = {
  SET_LOADING: 'SET_LOADING',
  SET_TRIPS: 'SET_TRIPS',
  SET_CURRENT_TRIP: 'SET_CURRENT_TRIP',
  ADD_TRIP: 'ADD_TRIP',
  UPDATE_TRIP: 'UPDATE_TRIP',
  DELETE_TRIP: 'DELETE_TRIP',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  SET_FILTERS: 'SET_FILTERS',
  SET_PAGINATION: 'SET_PAGINATION',
  RESET_STATE: 'RESET_STATE',
};

// Trip reducer
const tripReducer = (state, action) => {
  switch (action.type) {
    case tripActions.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload,
      };

    case tripActions.SET_TRIPS:
      return {
        ...state,
        trips: action.payload.trips,
        pagination: action.payload.pagination,
        isLoading: false,
        error: null,
      };

    case tripActions.SET_CURRENT_TRIP:
      return {
        ...state,
        currentTrip: action.payload,
        isLoading: false,
        error: null,
      };

    case tripActions.ADD_TRIP:
      return {
        ...state,
        trips: [action.payload, ...state.trips],
        isLoading: false,
        error: null,
      };

    case tripActions.UPDATE_TRIP:
      return {
        ...state,
        trips: state.trips.map((trip) =>
          trip.id === action.payload.id ? action.payload : trip
        ),
        currentTrip:
          state.currentTrip?.id === action.payload.id
            ? action.payload
            : state.currentTrip,
        isLoading: false,
        error: null,
      };

    case tripActions.DELETE_TRIP:
      return {
        ...state,
        trips: state.trips.filter((trip) => trip.id !== action.payload),
        currentTrip:
          state.currentTrip?.id === action.payload ? null : state.currentTrip,
        isLoading: false,
        error: null,
      };

    case tripActions.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      };

    case tripActions.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };

    case tripActions.SET_FILTERS:
      return {
        ...state,
        filters: { ...state.filters, ...action.payload },
      };

    case tripActions.SET_PAGINATION:
      return {
        ...state,
        pagination: { ...state.pagination, ...action.payload },
      };

    case tripActions.RESET_STATE:
      return initialState;

    default:
      return state;
  }
};

// Create context
const TripContext = createContext();

// Custom hook to use trip context
export const useTrips = () => {
  const context = useContext(TripContext);
  if (!context) {
    throw new Error('useTrips must be used within a TripProvider');
  }
  return context;
};

// Trip provider component
export const TripProvider = ({ children }) => {
  const [state, dispatch] = useReducer(tripReducer, initialState);
  const { isAuthenticated } = useAuth();

  // Reset state when user logs out
  useEffect(() => {
    if (!isAuthenticated) {
      dispatch({ type: tripActions.RESET_STATE });
    }
  }, [isAuthenticated]);

  // Fetch trips
  const fetchTrips = async (options = {}) => {
    try {
      dispatch({ type: tripActions.SET_LOADING, payload: true });
      dispatch({ type: tripActions.CLEAR_ERROR });

      const params = {
        ...state.filters,
        ...state.pagination,
        ...options,
      };

      const response = await tripsAPI.getTrips(params);
        dispatch({
        type: tripActions.SET_TRIPS,
        payload: {
          trips: response.trips,
          pagination: {
            page: response.page,
            limit: response.limit,
            total: response.total,
            pages: response.pages,
          },
        },
      });

      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch trips';
      dispatch({ type: tripActions.SET_ERROR, payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  };

  // Fetch single trip
  const fetchTrip = async (tripId) => {
    try {
      dispatch({ type: tripActions.SET_LOADING, payload: true });
      dispatch({ type: tripActions.CLEAR_ERROR });

      const response = await tripsAPI.getTrip(tripId);
      
      dispatch({
        type: tripActions.SET_CURRENT_TRIP,
        payload: response.data,
      });

      return { success: true, trip: response.data };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch trip';
      dispatch({ type: tripActions.SET_ERROR, payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  };

  // Create trip
  const createTrip = async (tripData) => {
    try {
      dispatch({ type: tripActions.SET_LOADING, payload: true });
      dispatch({ type: tripActions.CLEAR_ERROR });

      const response = await api.createTrip(tripData);
      
      dispatch({
        type: tripActions.ADD_TRIP,
        payload: response.data,
      });

      toast.success('Trip created successfully!');
      return { success: true, trip: response.data };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to create trip';
      dispatch({ type: tripActions.SET_ERROR, payload: errorMessage });
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Update trip
  const updateTrip = async (tripId, tripData) => {
    try {
      dispatch({ type: tripActions.SET_LOADING, payload: true });
      dispatch({ type: tripActions.CLEAR_ERROR });

      const response = await api.updateTrip(tripId, tripData);
      
      dispatch({
        type: tripActions.UPDATE_TRIP,
        payload: response.data,
      });

      toast.success('Trip updated successfully!');
      return { success: true, trip: response.data };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to update trip';
      dispatch({ type: tripActions.SET_ERROR, payload: errorMessage });
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Delete trip
  const deleteTrip = async (tripId) => {
    try {
      dispatch({ type: tripActions.SET_LOADING, payload: true });
      dispatch({ type: tripActions.CLEAR_ERROR });

      await api.deleteTrip(tripId);
      
      dispatch({
        type: tripActions.DELETE_TRIP,
        payload: tripId,
      });

      toast.success('Trip deleted successfully!');
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to delete trip';
      dispatch({ type: tripActions.SET_ERROR, payload: errorMessage });
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Add collaborator to trip
  const addCollaborator = async (tripId, email, role = 'viewer') => {
    try {
      const response = await api.addCollaborator(tripId, { email, role });
      
      dispatch({
        type: tripActions.UPDATE_TRIP,
        payload: response.data,
      });

      toast.success('Collaborator added successfully!');
      return { success: true, trip: response.data };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to add collaborator';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Remove collaborator from trip
  const removeCollaborator = async (tripId, userId) => {
    try {
      const response = await api.removeCollaborator(tripId, userId);
      
      dispatch({
        type: tripActions.UPDATE_TRIP,
        payload: response.data,
      });

      toast.success('Collaborator removed successfully!');
      return { success: true, trip: response.data };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to remove collaborator';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Update collaborator role
  const updateCollaboratorRole = async (tripId, userId, role) => {
    try {
      const response = await api.updateCollaboratorRole(tripId, userId, { role });
      
      dispatch({
        type: tripActions.UPDATE_TRIP,
        payload: response.data,
      });

      toast.success('Collaborator role updated successfully!');
      return { success: true, trip: response.data };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to update collaborator role';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Set filters
  const setFilters = (filters) => {
    dispatch({
      type: tripActions.SET_FILTERS,
      payload: filters,
    });
  };

  // Set pagination
  const setPagination = (pagination) => {
    dispatch({
      type: tripActions.SET_PAGINATION,
      payload: pagination,
    });
  };

  // Clear current trip
  const clearCurrentTrip = () => {
    dispatch({
      type: tripActions.SET_CURRENT_TRIP,
      payload: null,
    });
  };

  // Get trip by ID from state
  const getTripById = (tripId) => {
    return state.trips.find((trip) => trip.id === tripId) || null;
  };

  // Get user's trips by status
  const getTripsByStatus = (status) => {
    if (status === 'all') return state.trips;
    return state.trips.filter((trip) => trip.status === status);
  };

  // Get upcoming trips
  const getUpcomingTrips = () => {
    const now = new Date();
    return state.trips.filter((trip) => new Date(trip.startDate) > now);
  };

  // Get past trips
  const getPastTrips = () => {
    const now = new Date();
    return state.trips.filter((trip) => new Date(trip.endDate) < now);
  };

  // Get current trips (ongoing)
  const getCurrentTrips = () => {
    const now = new Date();
    return state.trips.filter((trip) => {
      const startDate = new Date(trip.startDate);
      const endDate = new Date(trip.endDate);
      return startDate <= now && endDate >= now;
    });
  };

  // Clear error
  const clearError = () => {
    dispatch({ type: tripActions.CLEAR_ERROR });
  };

  const value = {
    // State
    ...state,
    
    // Actions
    fetchTrips,
    fetchTrip,
    createTrip,
    updateTrip,
    deleteTrip,
    addCollaborator,
    removeCollaborator,
    updateCollaboratorRole,
    
    // Filters and pagination
    setFilters,
    setPagination,
    
    // Utilities
    clearCurrentTrip,
    getTripById,
    getTripsByStatus,
    getUpcomingTrips,
    getPastTrips,
    getCurrentTrips,
    clearError,
  };

  return <TripContext.Provider value={value}>{children}</TripContext.Provider>;
};

export default TripContext;

import React, { createContext, useContext, useEffect, useReducer } from 'react';
import { toast } from 'react-hot-toast';
import api from '../lib/api';

// Initial state
const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

// Auth actions
const authActions = {
  SET_LOADING: 'SET_LOADING',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGOUT: 'LOGOUT',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  UPDATE_USER: 'UPDATE_USER',
};

// Auth reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case authActions.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload,
      };

    case authActions.LOGIN_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };

    case authActions.LOGOUT:
      return {
        ...initialState,
        isLoading: false,
      };

    case authActions.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      };

    case authActions.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };

    case authActions.UPDATE_USER:
      return {
        ...state,
        user: { ...state.user, ...action.payload },
      };

    default:
      return state;
  }
};

// Create context
const AuthContext = createContext();

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const token = localStorage.getItem('token');
        const user = localStorage.getItem('user');

        if (token && user) {
          const parsedUser = JSON.parse(user);
          
          // Set the token in api instance
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          dispatch({
            type: authActions.LOGIN_SUCCESS,
            payload: {
              user: parsedUser,
              token,
            },
          });
        } else {
          dispatch({ type: authActions.SET_LOADING, payload: false });
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        dispatch({ type: authActions.SET_LOADING, payload: false });
      }
    };

    initializeAuth();
  }, []);

  // Login function
  const login = async (email, password) => {
    try {
      dispatch({ type: authActions.SET_LOADING, payload: true });
      dispatch({ type: authActions.CLEAR_ERROR });

      const response = await api.post('/api/v1/users/login', {
        email,
        password,
      });

      const { user, token } = response.data.data;

      // Store in localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      // Set authorization header
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      dispatch({
        type: authActions.LOGIN_SUCCESS,
        payload: { user, token },
      });

      toast.success('Login successful!');
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Login failed';
      dispatch({ type: authActions.SET_ERROR, payload: errorMessage });
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      dispatch({ type: authActions.SET_LOADING, payload: true });
      dispatch({ type: authActions.CLEAR_ERROR });

      const response = await api.post('/api/v1/users/register', userData);

      const { user, token } = response.data.data;

      // Store in localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      // Set authorization header
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      dispatch({
        type: authActions.LOGIN_SUCCESS,
        payload: { user, token },
      });

      toast.success('Registration successful!');
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Registration failed';
      dispatch({ type: authActions.SET_ERROR, payload: errorMessage });
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Logout function
  const logout = () => {
    // Clear localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    // Clear authorization header
    delete api.defaults.headers.common['Authorization'];

    dispatch({ type: authActions.LOGOUT });
    toast.success('Logged out successfully');
  };

  // Update user profile
  const updateUser = async (userData) => {
    try {
      const response = await api.put('/api/v1/users/profile', userData);
      const updatedUser = response.data.data.user;

      // Update localStorage
      localStorage.setItem('user', JSON.stringify(updatedUser));

      dispatch({
        type: authActions.UPDATE_USER,
        payload: updatedUser,
      });

      toast.success('Profile updated successfully!');
      return { success: true, user: updatedUser };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Update failed';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Change password
  const changePassword = async (currentPassword, newPassword) => {
    try {
      await api.put('/api/v1/users/change-password', {
        currentPassword,
        newPassword,
      });

      toast.success('Password changed successfully!');
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Password change failed';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Forgot password
  const forgotPassword = async (email) => {
    try {
      await api.post('/api/v1/users/forgot-password', { email });
      toast.success('Password reset instructions sent to your email');
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to send reset email';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Reset password
  const resetPassword = async (token, password) => {
    try {
      await api.post('/api/v1/users/reset-password', {
        token,
        password,
      });

      toast.success('Password reset successfully!');
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Password reset failed';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Check if user has specific permission
  const hasPermission = (permission) => {
    if (!state.user) return false;
    
    // Add permission checking logic based on user roles/permissions
    // For now, basic implementation
    return state.user.permissions?.includes(permission) || false;
  };

  // Check if user is admin
  const isAdmin = () => {
    return state.user?.role === 'admin' || false;
  };

  // Get user preferences
  const getUserPreferences = () => {
    return state.user?.preferences || {};
  };

  // Update user preferences
  const updatePreferences = async (preferences) => {
    try {
      const response = await api.put('/api/v1/users/profile', {
        preferences,
      });
      
      const updatedUser = response.data.data.user;
      localStorage.setItem('user', JSON.stringify(updatedUser));

      dispatch({
        type: authActions.UPDATE_USER,
        payload: updatedUser,
      });

      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to update preferences';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Demo login function for development
  const demoLogin = async () => {
    return await login('demo@tripify.com', 'demo123');
  };

  const value = {
    // State
    ...state,
    
    // Actions
    login,
    register,
    logout,
    updateUser,
    changePassword,
    forgotPassword,
    resetPassword,
    demoLogin,
    
    // Utilities
    hasPermission,
    isAdmin,
    getUserPreferences,
    updatePreferences,
    
    // Error handling
    clearError: () => dispatch({ type: authActions.CLEAR_ERROR }),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;

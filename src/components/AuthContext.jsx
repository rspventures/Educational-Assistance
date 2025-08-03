import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

// Base URL for your backend API (Centralized here)
export const API_BASE_URL = 'http://localhost:4000/api';

// --- Context for Authentication State ---
export const AuthContext = createContext(null);

// Custom hook to use the AuthContext
export const useAuth = () => {
  return useContext(AuthContext);
};

// --- Axios Interceptors (Centralized here for consistency) ---
axios.defaults.withCredentials = true;

axios.interceptors.request.use(
  config => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

axios.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;

    if (error.response.status === 401 && originalRequest.url !== `${API_BASE_URL}/login` && !originalRequest._retry) {
      originalRequest._retry = true;
      localStorage.removeItem('authToken');
      localStorage.removeItem('user'); // Also clear user data
      console.error('Session expired or unauthorized. Please log in again.');
    }
    return Promise.reject(error);
  }
);

// --- AuthProvider Component ---
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = () => {
      const token = localStorage.getItem('authToken');
      const storedUser = localStorage.getItem('user');

      if (token && storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          // Only update user if it's different from current state
          setUser(currentUser => 
            JSON.stringify(currentUser) !== storedUser ? parsedUser : currentUser
          );
        } catch (e) {
          console.error("Failed to parse stored user data:", e);
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (username, password) => {
    try {
      console.log('Sign in was Clicked.. and Inside AuhCOntext.jsx');
      const response = await axios.post(`${API_BASE_URL}/login`, { username, password });
      console.log('Login Response:' + JSON.stringify(response.data));
      const { access_token } = response.data;
      localStorage.setItem('authToken', access_token);

      // Store the full user object (or at least the username) in localStorage
      const loggedInUser = response.data; // Assuming backend only returns token, use input username
      console.log('User Info being stored at:' +  JSON.stringify(loggedInUser)  )
      localStorage.setItem('user', JSON.stringify(loggedInUser));
      setUser(loggedInUser);

      return true;
    } catch (error) {
      console.error('Login failed:', error.response ? error.response.data : error.message);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user'); // Clear user data on logout
    setUser(null);
  };

  const value = { user, loading, login, logout };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

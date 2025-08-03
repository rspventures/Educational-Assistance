import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx'; // Import useAuth from AuthContext.jsx
import axios from 'axios';

import './Login.css';

function LoginComponent() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { user, login } = useAuth();
  const navigate = useNavigate(); // Hook for programmatic navigation
  const location = useLocation(); // To get the state from redirection

  const characters = [
    { emoji: '🎓', className: 'character-1' },
    { emoji: '📚', className: 'character-2' },
    { emoji: '🎨', className: 'character-3' },
    { emoji: '🔬', className: 'character-4' },
    { emoji: '🎮', className: 'character-5' },
    { emoji: '🎵', className: 'character-6' }
  ];


  // State for animated character positions and targets
  const [charPositions, setCharPositions] = useState(
    Array.from({ length: characters.length }, () => ({ x: 0, y: 0 }))
  );
  const [charTargets, setCharTargets] = useState(
    Array.from({ length: characters.length }, () => ({ x: 0, y: 0 }))
  );

  // Get the path the user was trying to access before being redirected to login
  const from = location.state?.from?.pathname || "/protected";

  // This useEffect is now called unconditionally at the top level of the component
  useEffect(() => {

    if (user) {
      // Navigate to the 'from' path or '/protected' after successful login
      console.log('Authorized Login:..Reques came from ' + from);
      navigate(from, { replace: true });
    }
  }, [user, navigate, from]); // Dependencies ensure it re-runs when user or navigate/from changes

  const handleSubmit = async (e) => {

    e.preventDefault();
    setError('');
    const success = await login(username, password);
    console.log('Login Result:' + success);
    if (!success) {
      setError('Invalid username or password.');
    }
    // Navigation on success is now handled by the useEffect above
  };

  // If user is already logged in, this component will render null,
  // and the useEffect above will handle the navigation.
  if (user) {
    return null;
  }

  return (
    <div className="login-container">
      <div className="login-controls">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Login</h2>
        {error && <p className="text-red-500 text-xs italic mb-4">{error}</p>}
        <form className="login-form" onSubmit={handleSubmit}>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="username"
              style={{ alignSelf: 'flex-start', marginBottom: '6px', color: '#38bdf8', fontWeight: 600, paddingRight: '10px' }}
            >
              Username
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:border-blue-500"
              id="username"
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              style={{ marginBottom: '18px', padding: '10px', borderRadius: '6px', border: '1px solid #38bdf8', background: '#1e293b', color: '#f1f5f9' }}
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="password"
              style={{ alignSelf: 'flex-start', marginBottom: '6px', color: '#38bdf8', fontWeight: 600, paddingRight: '15px' }}
            >
              Password
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline focus:border-blue-500"
              id="password"
              type="password"
              placeholder="********"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ marginBottom: '18px', padding: '10px', borderRadius: '6px', border: '1px solid #38bdf8', background: '#1e293b', color: '#f1f5f9' }}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <button
              className="send-button"
              type="submit"
              style={{ minWidth: '90px' }}
            >
              Login
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default LoginComponent;

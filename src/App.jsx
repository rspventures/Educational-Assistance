import React, { useState, useEffect } from 'react';
import { Link, BrowserRouter, Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { API_BASE_URL, AuthProvider, useAuth } from './components/AuthContext.jsx'; // Import from AuthContext.jsx
import SubjectsComponent from './components/Subjects.jsx'; // Import the SubjectsComponent
import LoginComponent from './components/Login.jsx'; // Import the new LoginComponent
import AskAI from './components/Askai.jsx'; // Import the new LandingPage
import axios from 'axios'; // Import axios here as it's used in ProtectedComponent
import { motion } from 'framer-motion';
import { useRef } from 'react';
// Import styles
import './App.css';

// --- PrivateRoute Component ---
// This component protects routes, redirecting unauthenticated users to login
function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="text-center p-4">Checking authentication...</div>;
  }

  if (!user) {
    // Redirect to the login page, but remember the current location they were trying to go to
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}


const characters = [
  { emoji: '🎓', className: 'character-1' },
  { emoji: '📚', className: 'character-2' },
  { emoji: '🎨', className: 'character-3' },
  { emoji: '🔬', className: 'character-4' },
  { emoji: '🎮', className: 'character-5' },
  { emoji: '🎵', className: 'character-6' }
];

// --- Protected Component Example ---
function ProtectedComponent() {

  const { user, logout } = useAuth();
  const navigate = useNavigate(); // Hook for programmatic navigation
  const [data, setData] = useState(null);
  const [message, setMessage] = useState('Loading protected data...');



  useEffect(() => {
    // No need for 'loading' check here, PrivateRoute handles it
    if (user) { // Ensure user is available before fetching
      // Use axios directly as interceptors are set up in AuthContext.jsx
      axios.get(`${API_BASE_URL}/protected`)
        .then(response => {
          setData(response.data);
          setMessage('Protected data loaded!');
        })
        .catch(error => {
          console.error('Error fetching protected data:', error.response ? error.response.data : error.message);
          setMessage('Failed to load protected data. Maybe your session expired?');
        });
    }
  }, [user]); // Re-run when user changes

  return (
    <div className="p-6 bg-green-100 border border-green-400 text-green-700 rounded-lg shadow-md m-4">
      <h2 className="text-xl font-bold mb-4">Protected Content</h2>
      <p className="mb-2">{message}</p>
      {data && (
        <div className="bg-white p-4 rounded-md shadow-sm mb-4">
          <p><strong>Message from server:</strong> {data.message}</p>
          <p><strong>Logged in as:</strong> {data.logged_in_as}</p>
        </div>
      )}
    </div>
  );
}

// --- Main App Component ---
function App() {
  return (
    <AppContent />
  );

}

function AppContent() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const navigate = useNavigate(); // Use navigate for header buttons

  // ANIMATION START: Below Code is used to float/Animate characters defined above

  // State for animated character positions and targets
  const [charPositions, setCharPositions] = useState(
    Array.from({ length: characters.length }, () => ({ x: 0, y: 0 }))
  );
  const [charTargets, setCharTargets] = useState(
    Array.from({ length: characters.length }, () => ({ x: 50, y: 50 }))
  );

  const messagesRef = React.useRef(null);

  // Initialize all emojis at top-left (0,0)
  React.useEffect(() => {
    setCharPositions(characters.map(() => ({ x: 0, y: 0 })));
    if (!messagesRef.current) return;
    const rect = messagesRef.current.getBoundingClientRect();
    setCharTargets(
      characters.map(() => ({ x: Math.random() * (rect.width - 10), y: Math.random() * (rect.height - 10) }))
    );
  }, []);

  React.useEffect(() => {
    let timeout;
    function setNewTargets() {
      if (!messagesRef.current) return;
      const rect = messagesRef.current.getBoundingClientRect();
      setCharTargets(
        characters.map(() => ({ x: Math.random() * (rect.width - 40), y: Math.random() * (rect.height - 40) }))
      );
      timeout = setTimeout(setNewTargets, 3000 + Math.random() * 2000);
    }
    setNewTargets();
    return () => clearTimeout(timeout);
  }, []);

  React.useEffect(() => {
    let animationFrame;
    function moveToward(current, target, step = 1.2) {
      const dx = target.x - current.x;
      const dy = target.y - current.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < step) return { ...target };
      return {
        x: current.x + (dx / dist) * step,
        y: current.y + (dy / dist) * step,
      };
    }
    function animate() {
      setCharPositions(prevPositions => {
        if (!messagesRef.current) return prevPositions;
        const rect = messagesRef.current.getBoundingClientRect();
        return prevPositions.map((pos, idx) => {
          // If out of bounds (right or bottom), reset to top-left
          if (pos.x > rect.width || pos.y > rect.height) {
            return { x: 0, y: 0 };
          }
          return moveToward(pos, charTargets[idx] || pos, 1.2);
        });
      });
      animationFrame = requestAnimationFrame(animate);
    }
    animate();
    return () => cancelAnimationFrame(animationFrame);
  }, [charTargets]);
  // ANIMATION END: Below Code is used to float/Animate characters defined above

  const handleLogout = () => {
    logout();
    navigate('/'); // Navigate to Landing Page on logout
  };

  return (
    <div className="app-container">
      {/* Header Section */}
      <div className="app-header">

        <div className="header-content"><motion.h1 className="app-title"
          animate={{
            scale: [1, 1.05, 1],
            rotate: [0, 1, -1, 0]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatType: "reverse"
          }}
        >Educational Assistant</motion.h1>
        </div>
        <div className="header-controls">
          <div>
            {user && (
              <span className="welcome-message"
                style={{ textColor: 'white', borderColor: 'black', borderRadius: '8px', padding: '6px 18px', fontWeight: 600 }}
              >Welcome, {user.studentFullName} ({user.studentGrade}-{user.studentDivision})</span>
            )}
          </div>
          {/* Navigation/Login buttons aligned to the right */}
          <Link
            to="/"
            onClick={() => navigate('/')} // Use navigate for routing
            //className="bg-blue-700 hover:bg-blue-800 text-white font-bold py-2 px-3 rounded-full shadow-sm transition duration-300 ease-in-out text-sm"
            className={`app-links${location.pathname === '/' ? ' active-tab' : ''}`}
            style={{ cursor: 'pointer', margin: '0 12px', textDecoration: 'none' }}
          >
            Ask AI
          </Link>
          {!user ? ( // If not logged in, show Login button
            <Link
              to="/login" // Use navigate for routing
              //className="bg-blue-700 hover:bg-blue-800 text-white font-bold py-2 px-3 rounded-full shadow-sm transition duration-300 ease-in-out text-sm"
              className={`app-links${location.pathname === '/' ? ' active-tab' : ''}`}
              style={{ cursor: 'pointer', margin: '0 12px', textDecoration: 'none' }}
            >
              Login
            </Link>
          ) : ( // If logged in, show protected, subjects, and logout buttons
            <div>
              {/* Home button removed as requested */}
              <Link
                to="/protected" // Use navigate for routing
                //className="bg-blue-700 hover:bg-blue-800 text-white font-bold py-2 px-3 rounded-full shadow-sm transition duration-300 ease-in-out text-sm"
                className={`app-links${location.pathname === '/' ? ' active-tab' : ''}`}
                style={{ cursor: 'pointer', margin: '0 12px', textDecoration: 'none' }}
              >
                Protected
              </Link>
              <Link
                to="/subjects" // Use navigate for routing
                //className="bg-blue-700 hover:bg-blue-800 text-white font-bold py-2 px-3 rounded-full shadow-sm transition duration-300 ease-in-out text-sm"
                className={`app-links${location.pathname === '/' ? ' active-tab' : ''}`}
                style={{ cursor: 'pointer', margin: '0 12px', textDecoration: 'none' }}
              >
                Subjects
              </Link>
              <a
                href="#" // Optional: provide a fallback href, but prevent default behavior
                onClick={(e) => {
                  e.preventDefault(); // Prevent default link behavior
                  handleLogout(); // Call your logout function
                }}
                //className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-3 rounded-full shadow-lg transition duration-300 ease-in-out text-sm"
                className={`app-links${location.pathname === '/' ? ' active-tab' : ''}`}
                style={{ cursor: 'pointer', margin: '0 12px', textDecoration: 'none' }}
              >
                Logout
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Main content area */}
      {/* Main content switches here */}
      <div className="app-contents">
        <div className="app-contents-inner" ref={messagesRef}>
          {/* Routes for the application */}
          {characters.map((char, idx) => (
            <motion.span
              key={char.className}
              className={char.className + " floating-character"}
              style={{
                position: 'absolute',
                fontSize: '2rem',
                pointerEvents: 'none',
                zIndex: 1,
              }}
              animate={{
                x: charPositions[idx]?.x || 0,
                y: charPositions[idx]?.y || 0,
              }}
              transition={{
                type: "tween",
                ease: "linear",
                duration: 0.8,
              }}
            >
              {char.emoji}
            </motion.span>
          ))}
          <Routes>
            <Route path="/" element={<AskAI />} /> {/* Landing Page is the default for '/' */}
            {/* If user is logged in and tries to go to /login, redirect to /protected */}
            <Route
              path="/login"
              element={user ? <Navigate to="/subjects" replace /> : <LoginComponent />}
            />
            <Route
              path="/protected"
              element={
                <PrivateRoute>
                  <ProtectedComponent />
                </PrivateRoute>
              }
            />
            <Route
              path="/subjects"
              element={
                <PrivateRoute>
                  <SubjectsComponent />
                </PrivateRoute>
              }
            />
            {/* Fallback for any unmatched routes */}
            <Route path="*" element={<p className="text-red-500">404: Page Not Found</p>} />
          </Routes>
          {/* Animated floating characters */}
        </div>
      </div>
      {/* Footer */}
      {/* Footer always visible */}
      <div className="app-footer">
        © 2025 Educational Assistant. All rights reserved.
        <div className="footer-characters">
          <span>🌟</span>
          <span className='reverse'>🎨</span>
          <span>🎮</span>
        </div>
      </div>
    </div>
  );
}

export default function AppWrapper() {
  return (
    <AuthProvider>
      <BrowserRouter> {/* Wrap the App component with BrowserRouter */}
        <App />
      </BrowserRouter>
    </AuthProvider>
  );
}

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './AuthContext';
import Login from './components/Login';
import Register from './components/Register';
import Watchlist from './components/Watchlist';
import './App.css';

// Protected Route Wrapper
const ProtectedRoute = ({ children }) => {
  const { token, loading } = React.useContext(AuthContext);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', marginTop: '20%', color: '#9ca3af' }}>
        Loading Cinophile... 🍿
      </div>
    );
  }

  return token ? children : <Navigate to="/login" replace />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Watchlist />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
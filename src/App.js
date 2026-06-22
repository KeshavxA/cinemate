import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Profile from './pages/Profile';
import Watchlists from './pages/Watchlists';
import ProtectedRoute from './components/ProtectedRoute';
import MovieCard from './components/MovieCard';
import './App.css';

const DUMMY_MOVIES = [
  { id: '1', title: 'Inception', year: '2010' },
  { id: '2', title: 'The Matrix', year: '1999' },
  { id: '3', title: 'Interstellar', year: '2014' },
  { id: '4', title: 'Dune', year: '2021' },
];

function Home() {
  const { currentUser, logout } = useAuth();
  
  return (
    <div style={{ textAlign: 'center', padding: '40px' }}>
      <h1>Welcome to Cinemate</h1>
      <p>Your favorite movie tracking app.</p>
      
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '20px', marginBottom: '40px' }}>
        {!currentUser ? (
          <>
            <Link to="/login" style={navBtnStyle('#007bff')}>Log In</Link>
            <Link to="/signup" style={navBtnStyle('#28a745')}>Sign Up</Link>
          </>
        ) : (
          <>
            <Link to="/watchlists" style={navBtnStyle('#6f42c1')}>My Lists</Link>
            <Link to="/profile" style={navBtnStyle('#17a2b8')}>Profile</Link>
            <button onClick={logout} style={{...navBtnStyle('#dc3545'), border: 'none', cursor: 'pointer', fontSize: '16px'}}>Log Out</button>
          </>
        )}
      </div>

      <h2>Popular Movies</h2>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap', marginTop: '20px' }}>
        {DUMMY_MOVIES.map(movie => (
          <MovieCard key={movie.id} movie={movie} />
        ))}
      </div>
    </div>
  );
}

const navBtnStyle = (bgColor) => ({
  padding: '10px 20px', 
  backgroundColor: bgColor, 
  color: 'white', 
  textDecoration: 'none', 
  borderRadius: '4px'
});

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="App">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/watchlists" 
              element={
                <ProtectedRoute>
                  <Watchlists />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;

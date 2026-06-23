import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ThemeToggle from './components/ThemeToggle';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Profile from './pages/Profile';
import Watchlists from './pages/Watchlists';
import MovieDetails from './pages/MovieDetails';
import Search from './pages/Search';
import ProtectedRoute from './components/ProtectedRoute';
import MovieCard from './components/MovieCard';
import Recommendations from './components/Recommendations';
import { DUMMY_MOVIES } from './data/dummyMovies';
import './App.css';

function Home() {
  const { currentUser, logout } = useAuth();
  
  return (
    <div style={{ textAlign: 'center', padding: '40px' }}>
      <h1>Welcome to Cinemate</h1>
      <p style={{ color: 'var(--muted-text)' }}>Your favorite movie tracking app.</p>
      
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '20px', marginBottom: '40px', alignItems: 'center' }}>
        <ThemeToggle />
        <Link to="/search" style={navBtnStyle('#ffc107')}>Search</Link>
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

      <Recommendations />

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
    <ThemeProvider>
      <Router>
        <AuthProvider>
          <div className="App" style={{ minHeight: '100vh', transition: 'background-color 0.3s ease' }}>
            <Routes>
              <Route path="/" element={<Home />} />
            <Route path="/search" element={<Search />} />
            <Route path="/movie/:id" element={<MovieDetails />} />
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
    </ThemeProvider>
  );
}

export default App;

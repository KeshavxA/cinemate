import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { DUMMY_MOVIES } from '../data/dummyMovies';
import MovieCard from './MovieCard';

export default function Recommendations() {
  const { currentUser } = useAuth();
  const [recommendedMovies, setRecommendedMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [topGenres, setTopGenres] = useState([]);

  useEffect(() => {
    if (currentUser) {
      generateRecommendations();
    }
  }, [currentUser]);

  const generateRecommendations = async () => {
    setLoading(true);
    try {
      const interactedMovieIds = new Set();
      const genreCounts = {};

      // 1. Fetch user's watchlists
      const watchlistsQuery = query(collection(db, 'watchlists'), where('userId', '==', currentUser.uid));
      const watchlistsSnapshot = await getDocs(watchlistsQuery);
      
      watchlistsSnapshot.forEach(doc => {
        const data = doc.data();
        if (data.movies && Array.isArray(data.movies)) {
          data.movies.forEach(movieItem => {
            interactedMovieIds.add(movieItem.id);
            // find genre
            const movie = DUMMY_MOVIES.find(m => m.id === movieItem.id);
            if (movie && movie.genres) {
              movie.genres.forEach(g => {
                genreCounts[g] = (genreCounts[g] || 0) + 1;
              });
            }
          });
        }
      });

      // 2. Fetch user's highly-rated reviews (4 or 5 stars)
      const reviewsQuery = query(collection(db, 'reviews'), where('userId', '==', currentUser.uid), where('rating', '>=', 4));
      const reviewsSnapshot = await getDocs(reviewsQuery);
      
      reviewsSnapshot.forEach(doc => {
        const data = doc.data();
        interactedMovieIds.add(data.movieId);
        const movie = DUMMY_MOVIES.find(m => m.id === data.movieId);
        if (movie && movie.genres) {
          movie.genres.forEach(g => {
            genreCounts[g] = (genreCounts[g] || 0) + 2; // Weight reviews higher
          });
        }
      });

      // 3. Find top genres
      const sortedGenres = Object.keys(genreCounts).sort((a, b) => genreCounts[b] - genreCounts[a]);
      const top2Genres = sortedGenres.slice(0, 2);
      setTopGenres(top2Genres);

      // 4. Recommend movies matching top genres, excluding interacted movies
      if (top2Genres.length > 0) {
        const recommendations = DUMMY_MOVIES.filter(m => {
          if (interactedMovieIds.has(m.id)) return false;
          return m.genres?.some(g => top2Genres.includes(g));
        });
        
        // Shuffle or slice if needed, here we just take up to 5
        setRecommendedMovies(recommendations.slice(0, 5));
      } else {
        setRecommendedMovies([]);
      }
    } catch (error) {
      console.error("Error generating recommendations:", error);
    }
    setLoading(false);
  };

  if (!currentUser || loading) return null;

  if (recommendedMovies.length === 0) {
    return (
      <div style={{ margin: '40px 0' }}>
        <h2>Recommended for You</h2>
        <p style={{ color: 'var(--muted-text)' }}>Rate some movies or add them to your watchlist to get personalized recommendations!</p>
      </div>
    );
  }

  return (
    <div style={{ margin: '40px 0' }}>
      <h2>Recommended for You</h2>
      <p style={{ color: 'var(--muted-text)', marginBottom: '20px' }}>Based on your interest in: {topGenres.join(', ')}</p>
      <div style={{ display: 'flex', gap: '20px', overflowX: 'auto', paddingBottom: '10px' }}>
        {recommendedMovies.map(movie => (
          <MovieCard key={movie.id} movie={movie} />
        ))}
      </div>
    </div>
  );
}

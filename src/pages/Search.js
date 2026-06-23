import React, { useState, useMemo } from 'react';
import { DUMMY_MOVIES } from '../data/dummyMovies';
import MovieCard from '../components/MovieCard';

export default function Search() {
  const [searchTerm, setSearchTerm] = useState('');
  const [genre, setGenre] = useState('');
  const [year, setYear] = useState('');
  const [director, setDirector] = useState('');
  const [language, setLanguage] = useState('');
  const [sortBy, setSortBy] = useState('relevance');
  
  // Derive options from dummy data dynamically
  const genres = useMemo(() => {
    const allGenres = new Set();
    DUMMY_MOVIES.forEach(m => m.genres?.forEach(g => allGenres.add(g)));
    return Array.from(allGenres).sort();
  }, []);

  const years = useMemo(() => {
    return Array.from(new Set(DUMMY_MOVIES.map(m => m.year))).sort((a, b) => b - a); // Descending
  }, []);

  const directors = useMemo(() => {
    return Array.from(new Set(DUMMY_MOVIES.map(m => m.director).filter(Boolean))).sort();
  }, []);

  const languages = useMemo(() => {
    return Array.from(new Set(DUMMY_MOVIES.map(m => m.language).filter(Boolean))).sort();
  }, []);

  // Filter logic
  const filteredMovies = useMemo(() => {
    const filtered = DUMMY_MOVIES.filter(movie => {
      // 1. Text Search (title or actor)
      const matchesSearch = searchTerm === '' || 
        movie.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        movie.actors?.some(actor => actor.toLowerCase().includes(searchTerm.toLowerCase()));
      
      // 2. Genre Filter
      const matchesGenre = genre === '' || movie.genres?.includes(genre);

      // 3. Year Filter
      const matchesYear = year === '' || movie.year === year;

      // 4. Director Filter
      const matchesDirector = director === '' || movie.director === director;

      // 5. Language Filter
      const matchesLanguage = language === '' || movie.language === language;

      return matchesSearch && matchesGenre && matchesYear && matchesDirector && matchesLanguage;
    });
    
    // Sort logic
    if (sortBy === 'highestRated') {
      filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (sortBy === 'mostReviewed') {
      filtered.sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0));
    } else if (sortBy === 'newest') {
      filtered.sort((a, b) => parseInt(b.year) - parseInt(a.year));
    }
    
    return filtered;
  }, [searchTerm, genre, year, director, language, sortBy]);

  const clearFilters = () => {
    setSearchTerm('');
    setGenre('');
    setYear('');
    setDirector('');
    setLanguage('');
    setSortBy('relevance');
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
      <h1>Advanced Search</h1>
      
      {/* Search and Filters Section */}
      <div style={{ 
        backgroundColor: 'var(--section-bg)', 
        padding: '20px', 
        borderRadius: '8px', 
        marginBottom: '30px',
        display: 'flex',
        flexDirection: 'column',
        gap: '15px'
      }}>
        
        <div>
          <input 
            type="text" 
            placeholder="Search by title or actor name..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '12px', fontSize: '16px', borderRadius: '4px', border: '1px solid var(--input-border)', backgroundColor: 'var(--input-bg)', color: 'var(--text-color)', boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
          <select value={genre} onChange={(e) => setGenre(e.target.value)} style={filterStyle}>
            <option value="">All Genres</option>
            {genres.map(g => <option key={g} value={g}>{g}</option>)}
          </select>

          <select value={year} onChange={(e) => setYear(e.target.value)} style={filterStyle}>
            <option value="">All Years</option>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>

          <select value={director} onChange={(e) => setDirector(e.target.value)} style={filterStyle}>
            <option value="">All Directors</option>
            {directors.map(d => <option key={d} value={d}>{d}</option>)}
          </select>

          <select value={language} onChange={(e) => setLanguage(e.target.value)} style={filterStyle}>
            <option value="">All Languages</option>
            {languages.map(l => <option key={l} value={l}>{l}</option>)}
          </select>

          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{ ...filterStyle, fontWeight: 'bold' }}>
            <option value="relevance">Sort by Relevance</option>
            <option value="highestRated">Highest Rated</option>
            <option value="mostReviewed">Most Reviewed</option>
            <option value="newest">Newest Release</option>
          </select>

          <button onClick={clearFilters} style={{ padding: '10px 15px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            Clear Filters
          </button>
        </div>
      </div>

      {/* Results Section */}
      <div>
        <h2 style={{ marginBottom: '20px' }}>Results ({filteredMovies.length})</h2>
        {filteredMovies.length === 0 ? (
          <p style={{ color: 'var(--muted-text)' }}>No movies found matching your criteria.</p>
        ) : (
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            {filteredMovies.map(movie => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>
        )}
      </div>

    </div>
  );
}

const filterStyle = {
  padding: '10px',
  borderRadius: '4px',
  border: '1px solid var(--input-border)',
  backgroundColor: 'var(--input-bg)',
  color: 'var(--text-color)',
  flex: '1',
  minWidth: '150px'
};

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

  const [recentSearches, setRecentSearches] = useState(() => {
    const saved = localStorage.getItem('cinemate_recent_searches');
    return saved ? JSON.parse(saved) : [];
  });
  const [showRecent, setShowRecent] = useState(false);

  const saveSearchTerm = (term) => {
    const trimmed = term.trim();
    if (!trimmed) return;
    setRecentSearches(prev => {
      const filtered = prev.filter(t => t.toLowerCase() !== trimmed.toLowerCase());
      const updated = [trimmed, ...filtered].slice(0, 5);
      localStorage.setItem('cinemate_recent_searches', JSON.stringify(updated));
      return updated;
    });
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      saveSearchTerm(searchTerm);
      setShowRecent(false);
    }
  };

  const handleSearchBlur = () => {
    setTimeout(() => {
      saveSearchTerm(searchTerm);
      setShowRecent(false);
    }, 200);
  };

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

  const filteredMovies = useMemo(() => {
    const filtered = DUMMY_MOVIES.filter(movie => {

      const matchesSearch = searchTerm === '' ||
        movie.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        movie.actors?.some(actor => actor.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesGenre = genre === '' || movie.genres?.includes(genre);

      const matchesYear = year === '' || movie.year === year;

      const matchesDirector = director === '' || movie.director === director;

      const matchesLanguage = language === '' || movie.language === language;

      return matchesSearch && matchesGenre && matchesYear && matchesDirector && matchesLanguage;
    });

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

        <div style={{ position: 'relative' }}>
          <input
            type="text"
            placeholder="Search by title or actor name... (Press Enter to save to history)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => setShowRecent(true)}
            onBlur={handleSearchBlur}
            onKeyDown={handleSearchKeyDown}
            style={{ width: '100%', padding: '12px', fontSize: '16px', borderRadius: '4px', border: '1px solid var(--input-border)', backgroundColor: 'var(--input-bg)', color: 'var(--text-color)', boxSizing: 'border-box' }}
          />
          {showRecent && recentSearches.length > 0 && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              backgroundColor: 'var(--card-bg-color)',
              border: '1px solid var(--border-color)',
              borderRadius: '4px',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
              zIndex: 10,
              marginTop: '4px'
            }}>
              {recentSearches.map((term, index) => (
                <div
                  key={index}
                  onClick={() => {
                    setSearchTerm(term);
                    saveSearchTerm(term);
                    setShowRecent(false);
                  }}
                  style={{
                    padding: '10px 15px',
                    cursor: 'pointer',
                    borderBottom: index === recentSearches.length - 1 ? 'none' : '1px solid var(--border-color)'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--header-bg)'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                >
                  🕒 {term}
                </div>
              ))}
            </div>
          )}
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
          <div style={{ textAlign: 'center', padding: '60px 20px', backgroundColor: 'var(--section-bg)', borderRadius: '8px', border: '1px dashed var(--border-color)', marginTop: '20px' }}>
            <span style={{ fontSize: '48px', display: 'block', marginBottom: '15px' }}>🍿</span>
            <h3 style={{ margin: '0 0 10px 0' }}>No Movies Found</h3>
            <p style={{ color: 'var(--muted-text)', margin: 0 }}>We couldn't find any movies matching your current filters. Try tweaking your search terms or clearing some filters.</p>
            <button onClick={clearFilters} style={{ marginTop: '20px', padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
              Clear All Filters
            </button>
          </div>
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

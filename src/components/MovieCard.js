import React, { useState } from 'react';
import AddToListModal from './AddToListModal';
import { useAuth } from '../context/AuthContext';

export default function MovieCard({ movie }) {
  const [showModal, setShowModal] = useState(false);
  const { currentUser } = useAuth();

  const handleAddClick = () => {
    if (!currentUser) {
      alert("Please log in to add movies to your lists.");
      return;
    }
    setShowModal(true);
  };

  return (
    <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '15px', width: '200px', display: 'flex', flexDirection: 'column' }}>
      <div style={{ backgroundColor: '#f0f0f0', height: '250px', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '10px', borderRadius: '4px' }}>
        {/* Placeholder for movie poster */}
        <span style={{ color: '#888' }}>No Poster</span>
      </div>
      <h4 style={{ margin: '0 0 10px 0', fontSize: '16px', flex: 1 }}>{movie.title}</h4>
      <p style={{ margin: '0 0 15px 0', fontSize: '14px', color: '#666' }}>{movie.year}</p>
      
      <button 
        onClick={handleAddClick}
        style={{ padding: '8px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
      >
        Add to List
      </button>

      {showModal && (
        <AddToListModal 
          movie={movie} 
          onClose={() => setShowModal(false)} 
        />
      )}
    </div>
  );
}

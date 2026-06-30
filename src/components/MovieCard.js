import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import AddToListModal from './AddToListModal';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, getDocs, addDoc, updateDoc, arrayUnion, arrayRemove, doc as firestoreDoc } from 'firebase/firestore';
import { db } from '../firebase';

export default function MovieCard({ movie }) {
  const [showModal, setShowModal] = useState(false);
  const { currentUser } = useAuth();
  const [isWatched, setIsWatched] = useState(false);

  React.useEffect(() => {
    if (currentUser) {
      checkWatchedStatus();
    }
  }, [currentUser]);

  const checkWatchedStatus = async () => {
    try {
      const q = query(
        collection(db, 'watchlists'), 
        where('userId', '==', currentUser.uid),
        where('name', '==', 'Watched')
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        const listData = snap.docs[0].data();
        if (listData.movies.some(m => m.id === movie.id)) {
          setIsWatched(true);
        }
      }
    } catch (e) {
      console.error("Error checking watched status:", e);
    }
  };

  const handleToggleWatched = async () => {
    if (!currentUser) {
      alert("Please log in to mark movies as watched.");
      return;
    }

    const previousState = isWatched;
    setIsWatched(!previousState);

    try {
      const q = query(
        collection(db, 'watchlists'), 
        where('userId', '==', currentUser.uid),
        where('name', '==', 'Watched')
      );
      const snap = await getDocs(q);
      
      let listRef;
      let listData = null;
      if (snap.empty) {
        const docRef = await addDoc(collection(db, 'watchlists'), {
          name: 'Watched',
          isDefault: true,
          movies: [],
          userId: currentUser.uid
        });
        listRef = firestoreDoc(db, 'watchlists', docRef.id);
      } else {
        listRef = firestoreDoc(db, 'watchlists', snap.docs[0].id);
        listData = snap.docs[0].data();
      }

      if (previousState) {
        if (listData) {
          const movieToRemove = listData.movies.find(m => m.id === movie.id);
          if (movieToRemove) {
            await updateDoc(listRef, {
              movies: arrayRemove(movieToRemove)
            });
          }
        }
      } else {
        await updateDoc(listRef, {
          movies: arrayUnion(movie)
        });
      }
    } catch (error) {
      console.error("Error toggling watched:", error);
      setIsWatched(previousState);
    }
  };

  const handleAddClick = () => {
    if (!currentUser) {
      alert("Please log in to add movies to your lists.");
      return;
    }
    setShowModal(true);
  };

  return (
    <div style={{ border: '1px solid var(--border-color)', backgroundColor: 'var(--card-bg-color)', borderRadius: '8px', padding: '15px', width: '200px', display: 'flex', flexDirection: 'column' }}>
      <Link to={`/movie/${movie.id}`} style={{ textDecoration: 'none', color: 'inherit', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ backgroundColor: 'var(--header-bg)', height: '250px', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '10px', borderRadius: '4px' }}>
          {/* Placeholder for movie poster */}
          <span style={{ color: 'var(--muted-text)' }}>No Poster</span>
        </div>
        <h4 style={{ margin: '0 0 10px 0', fontSize: '16px', flex: 1 }}>{movie.title}</h4>
        <p style={{ margin: '0 0 5px 0', fontSize: '14px', color: 'var(--muted-text)' }}>{movie.year}</p>
        {(movie.rating || movie.reviewCount) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '15px', fontSize: '14px' }}>
            {movie.rating && <span style={{ color: '#ffc107' }}>⭐ {movie.rating}</span>}
            {movie.reviewCount && <span style={{ color: 'var(--muted-text)' }}>({movie.reviewCount.toLocaleString()})</span>}
          </div>
        )}
      </Link>
      
      <div style={{ display: 'flex', gap: '5px' }}>
        <button 
          onClick={handleAddClick}
          style={{ flex: 1, padding: '8px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          Add to List
        </button>
        <button 
          onClick={handleToggleWatched}
          style={{ 
            padding: '8px 12px', 
            backgroundColor: isWatched ? '#007bff' : 'var(--section-bg)', 
            color: isWatched ? 'white' : 'var(--text-color)', 
            border: '1px solid var(--border-color)', 
            borderRadius: '4px', 
            cursor: 'pointer' 
          }}
          title={isWatched ? "Mark as Unwatched" : "Mark as Watched"}
        >
          {isWatched ? '✅' : '👀'}
        </button>
      </div>

      {showModal && (
        <AddToListModal 
          movie={movie} 
          onClose={() => setShowModal(false)} 
        />
      )}
    </div>
  );
}

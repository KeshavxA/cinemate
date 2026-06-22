import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, addDoc, updateDoc, doc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';

export default function AddToListModal({ movie, onClose }) {
  const { currentUser } = useAuth();
  const [lists, setLists] = useState([]);
  const [newListName, setNewListName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser) {
      fetchUserLists();
    }
  }, [currentUser]);

  const fetchUserLists = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'watchlists'), where('userId', '==', currentUser.uid));
      const querySnapshot = await getDocs(q);
      const fetchedLists = [];
      querySnapshot.forEach((doc) => {
        fetchedLists.push({ id: doc.id, ...doc.data() });
      });
      
      // If no lists exist, create default ones
      if (fetchedLists.length === 0) {
        await createDefaultLists();
      } else {
        setLists(fetchedLists);
      }
    } catch (error) {
      console.error("Error fetching lists: ", error);
    }
    setLoading(false);
  };

  const createDefaultLists = async () => {
    const defaultLists = [
      { name: 'Favorites', isDefault: true, movies: [], userId: currentUser.uid },
      { name: 'To Watch', isDefault: true, movies: [], userId: currentUser.uid }
    ];
    
    for (const list of defaultLists) {
      await addDoc(collection(db, 'watchlists'), list);
    }
    fetchUserLists();
  };

  const createNewList = async (e) => {
    e.preventDefault();
    if (!newListName.trim()) return;
    
    try {
      await addDoc(collection(db, 'watchlists'), {
        name: newListName,
        isDefault: false,
        movies: [],
        userId: currentUser.uid
      });
      setNewListName('');
      fetchUserLists();
    } catch (error) {
      console.error("Error creating list: ", error);
    }
  };

  const toggleMovieInList = async (listId, moviesInList) => {
    const isMovieInList = moviesInList.some(m => m.id === movie.id);
    const listRef = doc(db, 'watchlists', listId);

    try {
      if (isMovieInList) {
        // Remove movie
        const movieToRemove = moviesInList.find(m => m.id === movie.id);
        await updateDoc(listRef, {
          movies: arrayRemove(movieToRemove)
        });
      } else {
        // Add movie
        await updateDoc(listRef, {
          movies: arrayUnion(movie)
        });
      }
      fetchUserLists(); // refresh list state
    } catch (error) {
      console.error("Error toggling movie: ", error);
    }
  };

  return (
    <div style={modalOverlayStyle}>
      <div style={modalContentStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h3 style={{ margin: 0 }}>Add "{movie.title}" to List</h3>
          <button onClick={onClose} style={closeButtonStyle}>&times;</button>
        </div>

        {loading ? (
          <p>Loading your lists...</p>
        ) : (
          <div>
            <div style={{ maxHeight: '200px', overflowY: 'auto', marginBottom: '15px' }}>
              {lists.map(list => {
                const isChecked = list.movies.some(m => m.id === movie.id);
                return (
                  <div key={list.id} style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                    <input 
                      type="checkbox" 
                      id={`list-${list.id}`} 
                      checked={isChecked}
                      onChange={() => toggleMovieInList(list.id, list.movies)}
                      style={{ marginRight: '10px' }}
                    />
                    <label htmlFor={`list-${list.id}`}>{list.name}</label>
                  </div>
                );
              })}
            </div>

            <form onSubmit={createNewList} style={{ display: 'flex', gap: '10px', borderTop: '1px solid #eee', paddingTop: '15px' }}>
              <input 
                type="text" 
                placeholder="New list name..." 
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
              />
              <button type="submit" style={{ padding: '8px 15px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                Create
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

const modalOverlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 1000
};

const modalContentStyle = {
  backgroundColor: 'white',
  padding: '20px',
  borderRadius: '8px',
  width: '100%',
  maxWidth: '400px',
  boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
};

const closeButtonStyle = {
  background: 'none',
  border: 'none',
  fontSize: '24px',
  cursor: 'pointer',
  padding: 0,
  color: '#666'
};

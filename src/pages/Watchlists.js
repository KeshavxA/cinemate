import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';

export default function Watchlists() {
  const { currentUser } = useAuth();
  const [lists, setLists] = useState([]);
  const [selectedList, setSelectedList] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newListName, setNewListName] = useState('');

  useEffect(() => {
    fetchUserLists();
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
      setLists(fetchedLists);
      if (fetchedLists.length > 0 && !selectedList) {
        setSelectedList(fetchedLists[0]);
      } else if (selectedList) {
        // Update selected list with new data
        const updatedSelected = fetchedLists.find(l => l.id === selectedList.id);
        if (updatedSelected) setSelectedList(updatedSelected);
      }
    } catch (error) {
      console.error("Error fetching lists: ", error);
    }
    setLoading(false);
  };

  const createNewList = async (e) => {
    e.preventDefault();
    if (!newListName.trim()) return;
    
    try {
      const newListRef = await addDoc(collection(db, 'watchlists'), {
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

  if (loading && lists.length === 0) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Loading your lists...</div>;
  }

  return (
    <div style={{ display: 'flex', minHeight: '80vh', padding: '20px', gap: '20px' }}>
      <div style={{ width: '250px', borderRight: '1px solid #ccc', paddingRight: '20px' }}>
        <h3>My Lists</h3>
        <ul style={{ listStyleType: 'none', padding: 0 }}>
          {lists.map(list => (
            <li 
              key={list.id} 
              onClick={() => setSelectedList(list)}
              style={{ 
                padding: '10px', 
                cursor: 'pointer', 
                backgroundColor: selectedList?.id === list.id ? '#f0f0f0' : 'transparent',
                borderRadius: '4px',
                marginBottom: '5px'
              }}
            >
              {list.name} ({list.movies?.length || 0})
            </li>
          ))}
        </ul>

        <form onSubmit={createNewList} style={{ marginTop: '20px' }}>
          <input 
            type="text" 
            placeholder="New list name" 
            value={newListName}
            onChange={(e) => setNewListName(e.target.value)}
            style={{ width: '100%', padding: '8px', marginBottom: '10px', boxSizing: 'border-box' }}
          />
          <button type="submit" style={{ width: '100%', padding: '8px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            Create List
          </button>
        </form>
      </div>

      <div style={{ flex: 1, paddingLeft: '20px' }}>
        {selectedList ? (
          <div>
            <h2>{selectedList.name}</h2>
            {selectedList.movies?.length === 0 ? (
              <p>No movies in this list yet.</p>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
                {selectedList.movies.map(movie => (
                  <div key={movie.id} style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '8px', width: '200px' }}>
                    <div style={{ backgroundColor: '#f0f0f0', height: '250px', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '10px' }}>
                      <span style={{ color: '#888' }}>No Poster</span>
                    </div>
                    <h4 style={{ margin: '0 0 10px 0' }}>{movie.title}</h4>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <p style={{ color: '#666' }}>Select a list to view its movies, or add movies from the home page.</p>
          </div>
        )}
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

export default function Profile() {
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    bio: '',
    avatarUrl: '',
    favoriteGenres: []
  });

  const [editData, setEditData] = useState({
    bio: '',
    avatarUrl: '',
    favoriteGenres: ''
  });

  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  useEffect(() => {
    if (currentUser) {
      fetchProfile();
    }
  }, [currentUser]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const docRef = doc(db, 'users', currentUser.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setProfileData({
          bio: data.bio || '',
          avatarUrl: data.avatarUrl || '',
          favoriteGenres: data.favoriteGenres || []
        });
        setEditData({
          bio: data.bio || '',
          avatarUrl: data.avatarUrl || '',
          favoriteGenres: (data.favoriteGenres || []).join(', ')
        });
      }
      
      // Fetch follow counts
      try {
        const followersQ = query(collection(db, 'follows'), where('followingId', '==', currentUser.uid));
        const followersSnap = await getDocs(followersQ);
        setFollowersCount(followersSnap.size);

        const followingQ = query(collection(db, 'follows'), where('followerId', '==', currentUser.uid));
        const followingSnap = await getDocs(followingQ);
        setFollowingCount(followingSnap.size);
      } catch (e) {
        console.error("Error fetching follow counts", e);
      }

    } catch (err) {
      console.error("Failed to fetch profile", err);
      setError("Failed to fetch profile data");
    }
    setLoading(false);
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    try {
      const genresArray = editData.favoriteGenres
        .split(',')
        .map(g => g.trim())
        .filter(g => g.length > 0);

      const newData = {
        bio: editData.bio,
        avatarUrl: editData.avatarUrl,
        favoriteGenres: genresArray
      };

      await setDoc(doc(db, 'users', currentUser.uid), newData, { merge: true });
      
      setProfileData(newData);
      setSuccess('Profile updated successfully!');
      setIsEditing(false);
    } catch (err) {
      console.error("Failed to save profile", err);
      setError('Failed to update profile');
    }
  };

  async function handleLogout() {
    setError('');
    try {
      await logout();
      navigate('/login');
    } catch {
      setError('Failed to log out');
    }
  }

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '40px' }}>Loading Profile...</div>;
  }

  return (
    <div style={{ maxWidth: '600px', margin: '40px auto', padding: '30px', border: '1px solid var(--border-color)', backgroundColor: 'var(--card-bg-color)', borderRadius: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0 }}>My Profile</h2>
        <button onClick={handleLogout} style={{ padding: '8px 16px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          Log Out
        </button>
      </div>

      {error && <div style={{ color: 'red', marginBottom: '15px', padding: '10px', backgroundColor: 'rgba(255,0,0,0.1)', borderRadius: '4px' }}>{error}</div>}
      {success && <div style={{ color: 'green', marginBottom: '15px', padding: '10px', backgroundColor: 'rgba(0,255,0,0.1)', borderRadius: '4px' }}>{success}</div>}

      <div style={{ marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <strong>Email:</strong> <span style={{ color: 'var(--muted-text)' }}>{currentUser?.email}</span>
        </div>
        <div style={{ display: 'flex', gap: '20px' }}>
          <div><strong>{followersCount}</strong> <span style={{ color: 'var(--muted-text)' }}>Followers</span></div>
          <div><strong>{followingCount}</strong> <span style={{ color: 'var(--muted-text)' }}>Following</span></div>
        </div>
      </div>

      {!isEditing ? (
        <div>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', marginBottom: '30px' }}>
            <div style={{ width: '100px', height: '100px', borderRadius: '50%', backgroundColor: 'var(--header-bg)', overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0, border: '2px solid var(--border-color)' }}>
              {profileData.avatarUrl ? (
                <img src={profileData.avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ fontSize: '40px', color: 'var(--muted-text)' }}>👤</span>
              )}
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: '0 0 10px 0' }}>Bio</h3>
              <p style={{ margin: '0 0 20px 0', lineHeight: '1.5', color: profileData.bio ? 'var(--text-color)' : 'var(--muted-text)' }}>
                {profileData.bio || "No bio added yet. Tell us about your favorite cinematic moments!"}
              </p>

              <h3 style={{ margin: '0 0 10px 0' }}>Favorite Genres</h3>
              {profileData.favoriteGenres.length > 0 ? (
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {profileData.favoriteGenres.map((genre, index) => (
                    <span key={index} style={{ padding: '4px 10px', backgroundColor: '#007bff', color: 'white', borderRadius: '20px', fontSize: '14px' }}>
                      {genre}
                    </span>
                  ))}
                </div>
              ) : (
                <p style={{ margin: 0, color: 'var(--muted-text)' }}>No favorite genres selected.</p>
              )}
            </div>
          </div>
          <button onClick={() => setIsEditing(true)} style={{ width: '100%', padding: '12px', backgroundColor: 'var(--header-bg)', color: 'var(--text-color)', border: '1px solid var(--border-color)', borderRadius: '4px', cursor: 'pointer', fontSize: '16px' }}>
            Edit Profile
          </button>
        </div>
      ) : (
        <form onSubmit={saveProfile}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Avatar Image URL</label>
            <input 
              type="url" 
              value={editData.avatarUrl} 
              onChange={(e) => setEditData({...editData, avatarUrl: e.target.value})} 
              placeholder="https://example.com/my-avatar.jpg"
              style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid var(--input-border)', backgroundColor: 'var(--input-bg)', color: 'var(--text-color)', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Bio</label>
            <textarea 
              rows="4"
              value={editData.bio} 
              onChange={(e) => setEditData({...editData, bio: e.target.value})} 
              placeholder="Tell us a bit about yourself..."
              style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid var(--input-border)', backgroundColor: 'var(--input-bg)', color: 'var(--text-color)', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ marginBottom: '25px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Favorite Genres</label>
            <input 
              type="text" 
              value={editData.favoriteGenres} 
              onChange={(e) => setEditData({...editData, favoriteGenres: e.target.value})} 
              placeholder="e.g. Action, Sci-Fi, Thriller"
              style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid var(--input-border)', backgroundColor: 'var(--input-bg)', color: 'var(--text-color)', boxSizing: 'border-box' }}
            />
            <small style={{ color: 'var(--muted-text)', display: 'block', marginTop: '5px' }}>Separate genres with commas</small>
          </div>

          <div style={{ display: 'flex', gap: '15px' }}>
            <button type="submit" style={{ flex: 1, padding: '12px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '16px' }}>
              Save Changes
            </button>
            <button type="button" onClick={() => setIsEditing(false)} style={{ flex: 1, padding: '12px', backgroundColor: 'var(--header-bg)', color: 'var(--text-color)', border: '1px solid var(--border-color)', borderRadius: '4px', cursor: 'pointer', fontSize: '16px' }}>
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

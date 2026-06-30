import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs, addDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import StarRating from '../components/StarRating';
import ReviewItem from '../components/ReviewItem';

export default function PublicProfile() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [profile, setProfile] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Follow state
  const [isFollowing, setIsFollowing] = useState(false);
  const [followDocId, setFollowDocId] = useState(null);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    if (!userId) return;
    
    // Redirect to personal profile if viewing own profile
    if (currentUser && currentUser.uid === userId) {
      navigate('/profile');
      return;
    }

    fetchProfileData();
    if (currentUser) {
      checkFollowStatus();
    }
  }, [userId, currentUser, navigate]);

  const fetchProfileData = async () => {
    setLoading(true);
    try {
      // Fetch user profile
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        setProfile(userDoc.data());
      } else {
        setProfile({ bio: 'This user has not set up their profile yet.' });
      }

      // Fetch user's reviews
      const q = query(collection(db, 'reviews'), where('userId', '==', userId));
      const querySnapshot = await getDocs(q);
      const fetchedReviews = [];
      querySnapshot.forEach(doc => {
        fetchedReviews.push({ id: doc.id, ...doc.data() });
      });
      // Sort newest first
      fetchedReviews.sort((a, b) => b.createdAt - a.createdAt);
      setReviews(fetchedReviews);
    } catch (err) {
      console.error("Error fetching profile: ", err);
    }
    setLoading(false);
  };

  const checkFollowStatus = async () => {
    try {
      const q = query(
        collection(db, 'follows'), 
        where('followerId', '==', currentUser.uid),
        where('followingId', '==', userId)
      );
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        setIsFollowing(true);
        setFollowDocId(snapshot.docs[0].id);
      } else {
        setIsFollowing(false);
        setFollowDocId(null);
      }
    } catch (err) {
      console.error("Error checking follow status: ", err);
    }
  };

  const toggleFollow = async () => {
    if (!currentUser) {
      alert("Please log in to follow users.");
      navigate('/login');
      return;
    }

    setFollowLoading(true);
    try {
      if (isFollowing) {
        // Unfollow
        await deleteDoc(doc(db, 'follows', followDocId));
        setIsFollowing(false);
        setFollowDocId(null);
      } else {
        // Follow
        const docRef = await addDoc(collection(db, 'follows'), {
          followerId: currentUser.uid,
          followingId: userId,
          createdAt: Date.now()
        });
        setIsFollowing(true);
        setFollowDocId(docRef.id);
      }
    } catch (err) {
      console.error("Error toggling follow: ", err);
      alert("Failed to update follow status.");
    }
    setFollowLoading(false);
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '40px' }}>Loading Profile...</div>;
  }

  return (
    <div style={{ maxWidth: '800px', margin: '40px auto', padding: '20px' }}>
      <button onClick={() => navigate(-1)} style={{ marginBottom: '20px', cursor: 'pointer', background: 'none', border: 'none', color: 'var(--text-color)', fontSize: '16px' }}>&larr; Back</button>

      <div style={{ padding: '30px', border: '1px solid var(--border-color)', backgroundColor: 'var(--card-bg-color)', borderRadius: '12px', marginBottom: '30px' }}>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
          <div style={{ width: '100px', height: '100px', borderRadius: '50%', backgroundColor: 'var(--header-bg)', overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0, border: '2px solid var(--border-color)' }}>
            {profile?.avatarUrl ? (
              <img src={profile.avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ fontSize: '40px', color: 'var(--muted-text)' }}>👤</span>
            )}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <h2 style={{ margin: 0 }}>Cinephile Profile</h2>
                <button onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  alert('Link copied to clipboard!');
                }} style={{ padding: '6px 10px', backgroundColor: 'var(--section-bg)', border: '1px solid var(--border-color)', borderRadius: '4px', cursor: 'pointer', color: 'var(--text-color)', fontSize: '14px' }}>
                  🔗 Share
                </button>
              </div>
              {currentUser && (
                <button 
                  onClick={toggleFollow} 
                  disabled={followLoading}
                  style={{ 
                    padding: '8px 20px', 
                    backgroundColor: isFollowing ? 'var(--header-bg)' : '#007bff', 
                    color: isFollowing ? 'var(--text-color)' : 'white', 
                    border: isFollowing ? '1px solid var(--border-color)' : 'none', 
                    borderRadius: '20px', 
                    cursor: followLoading ? 'wait' : 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  {isFollowing ? 'Following' : 'Follow'}
                </button>
              )}
            </div>

            <p style={{ margin: '0 0 20px 0', lineHeight: '1.5', color: profile?.bio ? 'var(--text-color)' : 'var(--muted-text)' }}>
              {profile?.bio || "No bio added yet."}
            </p>

            {profile?.favoriteGenres && profile.favoriteGenres.length > 0 && (
              <div>
                <h4 style={{ margin: '0 0 10px 0' }}>Favorite Genres</h4>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {profile.favoriteGenres.map((genre, index) => (
                    <span key={index} style={{ padding: '4px 10px', backgroundColor: '#007bff', color: 'white', borderRadius: '20px', fontSize: '14px' }}>
                      {genre}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <h3>Recent Reviews ({reviews.length})</h3>
      {reviews.length === 0 ? (
        <p style={{ color: 'var(--muted-text)' }}>This user hasn't written any reviews yet.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {reviews.map(review => (
            <ReviewItem 
              key={review.id} 
              review={review} 
              showMovieLink={true} 
              movieTitle="View Movie Details" 
            />
          ))}
        </div>
      )}
    </div>
  );
}

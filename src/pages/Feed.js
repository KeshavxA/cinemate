import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import StarRating from '../components/StarRating';
import ReviewItem from '../components/ReviewItem';
import { DUMMY_MOVIES } from '../data/dummyMovies';

export default function Feed() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [feedItems, setFeedItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const handleReviewDelete = (reviewId) => {
    setFeedItems(prev => prev.filter(item => item.id !== reviewId));
  };

  useEffect(() => {
    if (currentUser) {
      fetchFeed();
    } else {
      setLoading(false);
    }
  }, [currentUser]);

  const fetchFeed = async () => {
    setLoading(true);
    try {
      // 1. Get list of users the current user is following
      const followsQ = query(collection(db, 'follows'), where('followerId', '==', currentUser.uid));
      const followsSnap = await getDocs(followsQ);
      
      const followingIds = [];
      followsSnap.forEach(doc => {
        followingIds.push(doc.data().followingId);
      });

      if (followingIds.length === 0) {
        setFeedItems([]);
        setLoading(false);
        return;
      }

      // Firestore 'in' query allows up to 10 elements. We will just use the first 10 for this demo.
      const chunk = followingIds.slice(0, 10);

      // 2. Fetch reviews from those users
      const reviewsQ = query(
        collection(db, 'reviews'), 
        where('userId', 'in', chunk)
      );
      const reviewsSnap = await getDocs(reviewsQ);
      
      const fetchedReviews = [];
      reviewsSnap.forEach(doc => {
        fetchedReviews.push({ id: doc.id, itemType: 'review', ...doc.data() });
      });

      // 3. Fetch activities from those users
      const activitiesQ = query(
        collection(db, 'activities'), 
        where('userId', 'in', chunk)
      );
      const activitiesSnap = await getDocs(activitiesQ);
      
      const fetchedActivities = [];
      activitiesSnap.forEach(doc => {
        fetchedActivities.push({ id: doc.id, itemType: 'activity', ...doc.data() });
      });

      // Merge and Sort newest first
      const combined = [...fetchedReviews, ...fetchedActivities];
      combined.sort((a, b) => b.createdAt - a.createdAt);
      setFeedItems(combined);
    } catch (error) {
      console.error("Error fetching feed:", error);
    }
    setLoading(false);
  };

  if (!currentUser) {
    return (
      <div style={{ textAlign: 'center', margin: '40px 0' }}>
        <h2>Friends Feed</h2>
        <p style={{ color: 'var(--muted-text)' }}>Log in to see what your friends are reviewing!</p>
        <button onClick={() => navigate('/login')} style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          Log In
        </button>
      </div>
    );
  }

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '40px' }}>Loading Feed...</div>;
  }

  return (
    <div style={{ maxWidth: '800px', margin: '40px auto', padding: '20px' }}>
      <h2>Activity Feed</h2>
      <p style={{ color: 'var(--muted-text)', marginBottom: '30px' }}>Recent reviews from cinephiles you follow.</p>

      {feedItems.length === 0 ? (
        <div style={{ padding: '60px 20px', textAlign: 'center', border: '1px dashed var(--border-color)', backgroundColor: 'var(--card-bg-color)', borderRadius: '8px' }}>
          <span style={{ fontSize: '48px', display: 'block', marginBottom: '15px' }}>🦗</span>
          <h3 style={{ margin: '0 0 10px 0' }}>It's quiet... too quiet.</h3>
          <p style={{ color: 'var(--muted-text)', marginTop: '10px' }}>Follow more users or wait for them to post reviews or add movies to their watchlists!</p>
          <button onClick={() => navigate('/')} style={{ marginTop: '20px', padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
            Explore Movies
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {feedItems.map(item => {
            const movie = DUMMY_MOVIES.find(m => m.id === item.movieId);
            
            if (item.itemType === 'activity' && item.type === 'watchlist_add') {
              return (
                <div key={item.id} style={{ border: '1px solid var(--border-color)', backgroundColor: 'var(--card-bg-color)', padding: '20px', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <Link to={`/user/${item.userId}`} style={{ color: 'var(--text-color)', textDecoration: 'none', fontWeight: 'bold' }}>
                        {item.userEmail}
                      </Link>
                      <span style={{ color: 'var(--muted-text)', margin: '0 10px' }}>added</span>
                      <Link to={`/movie/${item.movieId}`} style={{ color: '#007bff', textDecoration: 'none', fontWeight: 'bold' }}>
                        {movie ? movie.title : 'a movie'}
                      </Link>
                      <span style={{ color: 'var(--muted-text)', margin: '0 10px' }}>to their list</span>
                      <strong>{item.listName}</strong>
                    </div>
                    <span style={{ color: 'var(--muted-text)', fontSize: '14px' }}>{new Date(item.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              );
            }

            // Otherwise, it's a review
            return (
              <ReviewItem 
                key={item.id} 
                review={item} 
                showMovieLink={true} 
                movieTitle={movie ? movie.title : 'a movie'} 
                onDelete={handleReviewDelete}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

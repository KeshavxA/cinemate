import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import StarRating from '../components/StarRating';
import { DUMMY_MOVIES } from '../data/dummyMovies';

export default function Feed() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [feedReviews, setFeedReviews] = useState([]);
  const [loading, setLoading] = useState(true);

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
        setFeedReviews([]);
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
        fetchedReviews.push({ id: doc.id, ...doc.data() });
      });

      // Sort newest first
      fetchedReviews.sort((a, b) => b.createdAt - a.createdAt);
      setFeedReviews(fetchedReviews);
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

      {feedReviews.length === 0 ? (
        <div style={{ padding: '30px', textAlign: 'center', border: '1px solid var(--border-color)', backgroundColor: 'var(--card-bg-color)', borderRadius: '8px' }}>
          <p>Your feed is quiet right now.</p>
          <p style={{ color: 'var(--muted-text)', marginTop: '10px' }}>Follow more users or wait for them to post reviews!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {feedReviews.map(review => {
            const movie = DUMMY_MOVIES.find(m => m.id === review.movieId);
            return (
              <div key={review.id} style={{ border: '1px solid var(--border-color)', backgroundColor: 'var(--card-bg-color)', padding: '20px', borderRadius: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                  <div>
                    <Link to={`/user/${review.userId}`} style={{ color: 'var(--text-color)', textDecoration: 'none', fontWeight: 'bold' }}>
                      {review.userEmail}
                    </Link>
                    <span style={{ color: 'var(--muted-text)', margin: '0 10px' }}>reviewed</span>
                    <Link to={`/movie/${review.movieId}`} style={{ color: '#007bff', textDecoration: 'none', fontWeight: 'bold' }}>
                      {movie ? movie.title : 'a movie'}
                    </Link>
                  </div>
                  <span style={{ color: 'var(--muted-text)', fontSize: '14px' }}>{new Date(review.createdAt).toLocaleDateString()}</span>
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <StarRating rating={review.rating} readOnly={true} />
                </div>
                <p style={{ margin: 0, lineHeight: '1.5' }}>{review.reviewText}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

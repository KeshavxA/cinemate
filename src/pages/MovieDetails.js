import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, addDoc, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { DUMMY_MOVIES } from '../data/dummyMovies';
import StarRating from '../components/StarRating';

export default function MovieDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [movie, setMovie] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // New review form state
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // In a real app, this would fetch from TMDB
    const foundMovie = DUMMY_MOVIES.find(m => m.id === id);
    if (!foundMovie) {
      navigate('/');
      return;
    }
    setMovie(foundMovie);
    fetchReviews(foundMovie.id);
  }, [id, navigate]);

  const fetchReviews = async (movieId) => {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'reviews'), 
        where('movieId', '==', movieId)
      );
      const querySnapshot = await getDocs(q);
      const fetchedReviews = [];
      let totalRating = 0;
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        fetchedReviews.push({ id: doc.id, ...data });
        totalRating += data.rating;
      });

      // Sort reviews by date (newest first)
      fetchedReviews.sort((a, b) => b.createdAt - a.createdAt);

      setReviews(fetchedReviews);
      
      if (fetchedReviews.length > 0) {
        setAverageRating((totalRating / fetchedReviews.length).toFixed(1));
      } else {
        setAverageRating(0);
      }
    } catch (error) {
      console.error("Error fetching reviews: ", error);
    }
    setLoading(false);
  };

  const submitReview = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      alert('Please select a star rating');
      return;
    }
    if (!reviewText.trim()) {
      alert('Please write a review');
      return;
    }

    setSubmitting(true);
    try {
      await addDoc(collection(db, 'reviews'), {
        movieId: movie.id,
        userId: currentUser.uid,
        userEmail: currentUser.email,
        rating,
        reviewText,
        createdAt: Date.now()
      });
      setRating(0);
      setReviewText('');
      fetchReviews(movie.id); // Refresh reviews
    } catch (error) {
      console.error("Error submitting review: ", error);
      alert('Failed to submit review');
    }
    setSubmitting(false);
  };

  if (!movie) return <div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <button onClick={() => navigate(-1)} style={{ marginBottom: '20px', cursor: 'pointer' }}>&larr; Back</button>
      
      <div style={{ display: 'flex', gap: '20px', marginBottom: '40px' }}>
        <div style={{ width: '200px', height: '300px', backgroundColor: '#f0f0f0', display: 'flex', justifyContent: 'center', alignItems: 'center', borderRadius: '8px' }}>
          <span style={{ color: '#888' }}>No Poster</span>
        </div>
        <div>
          <h1 style={{ margin: '0 0 10px 0' }}>{movie.title} ({movie.year})</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <StarRating rating={Math.round(averageRating)} readOnly={true} />
            <span style={{ fontSize: '18px', fontWeight: 'bold' }}>{averageRating > 0 ? averageRating : 'No ratings yet'}</span>
            <span style={{ color: '#666' }}>({reviews.length} reviews)</span>
          </div>
          <p style={{ lineHeight: '1.6' }}>{movie.description}</p>
        </div>
      </div>

      <div style={{ borderTop: '1px solid #ddd', paddingTop: '30px' }}>
        <h2>Community Reviews</h2>
        
        {currentUser ? (
          <form onSubmit={submitReview} style={{ backgroundColor: '#f9f9f9', padding: '20px', borderRadius: '8px', marginBottom: '30px' }}>
            <h3>Write a Review</h3>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Rating</label>
              <StarRating rating={rating} setRating={setRating} />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Review</label>
              <textarea 
                rows="4" 
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
                placeholder="What did you think of the movie?"
              />
            </div>
            <button disabled={submitting} type="submit" style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
              {submitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </form>
        ) : (
          <div style={{ backgroundColor: '#f9f9f9', padding: '20px', borderRadius: '8px', marginBottom: '30px', textAlign: 'center' }}>
            <p>You must be logged in to leave a review.</p>
            <button onClick={() => navigate('/login')} style={{ padding: '8px 15px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Log In</button>
          </div>
        )}

        {loading ? (
          <p>Loading reviews...</p>
        ) : reviews.length === 0 ? (
          <p>No reviews yet. Be the first to review!</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {reviews.map(review => (
              <div key={review.id} style={{ border: '1px solid #eee', padding: '15px', borderRadius: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <strong>{review.userEmail}</strong>
                  <span style={{ color: '#888', fontSize: '14px' }}>{new Date(review.createdAt).toLocaleDateString()}</span>
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <StarRating rating={review.rating} readOnly={true} />
                </div>
                <p style={{ margin: 0 }}>{review.reviewText}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import StarRating from './StarRating';

export default function ReviewItem({ review, showMovieLink = false, movieTitle = 'a movie' }) {
  const { currentUser } = useAuth();
  const [likes, setLikes] = useState(review.likedBy || []);
  const [isLiking, setIsLiking] = useState(false);
  const [isSpoilerRevealed, setIsSpoilerRevealed] = useState(false);

  const hasLiked = currentUser ? likes.includes(currentUser.uid) : false;

  const handleLike = async () => {
    if (!currentUser) {
      alert('Please log in to like a review.');
      return;
    }
    if (isLiking) return;

    setIsLiking(true);
    try {
      const reviewRef = doc(db, 'reviews', review.id);
      if (hasLiked) {
        await updateDoc(reviewRef, {
          likedBy: arrayRemove(currentUser.uid)
        });
        setLikes(likes.filter(id => id !== currentUser.uid));
      } else {
        await updateDoc(reviewRef, {
          likedBy: arrayUnion(currentUser.uid)
        });
        setLikes([...likes, currentUser.uid]);
      }
    } catch (err) {
      console.error("Error updating like status:", err);
    }
    setIsLiking(false);
  };

  return (
    <div style={{ border: '1px solid var(--border-color)', backgroundColor: 'var(--card-bg-color)', padding: '20px', borderRadius: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
        <div>
          <Link to={`/user/${review.userId}`} style={{ color: 'var(--text-color)', textDecoration: 'none', fontWeight: 'bold' }}>
            {review.userEmail}
          </Link>
          {showMovieLink && (
            <>
              <span style={{ color: 'var(--muted-text)', margin: '0 10px' }}>reviewed</span>
              <Link to={`/movie/${review.movieId}`} style={{ color: '#007bff', textDecoration: 'none', fontWeight: 'bold' }}>
                {movieTitle}
              </Link>
            </>
          )}
        </div>
        <span style={{ color: 'var(--muted-text)', fontSize: '14px' }}>{new Date(review.createdAt).toLocaleDateString()}</span>
      </div>
      <div style={{ marginBottom: '10px' }}>
        <StarRating rating={review.rating} readOnly={true} />
      </div>
      {review.containsSpoilers && !isSpoilerRevealed ? (
        <div 
          onClick={() => setIsSpoilerRevealed(true)}
          style={{ 
            backgroundColor: 'var(--section-bg)', 
            padding: '15px', 
            borderRadius: '4px', 
            border: '1px dashed var(--border-color)', 
            cursor: 'pointer', 
            textAlign: 'center',
            marginBottom: '15px',
            color: 'var(--muted-text)'
          }}
        >
          🚫 Contains Spoilers - Click to View
        </div>
      ) : (
        <p style={{ margin: 0, lineHeight: '1.5', marginBottom: '15px' }}>{review.reviewText}</p>
      )}
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button 
          onClick={handleLike}
          disabled={isLiking}
          style={{ 
            background: 'none', 
            border: 'none', 
            cursor: currentUser ? 'pointer' : 'default', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '5px',
            padding: '5px 10px',
            borderRadius: '20px',
            backgroundColor: hasLiked ? 'rgba(255, 0, 0, 0.1)' : 'var(--section-bg)',
            color: hasLiked ? '#e25555' : 'var(--muted-text)',
            transition: 'background-color 0.2s',
            fontSize: '14px'
          }}
        >
          {hasLiked ? '❤️' : '🤍'} {likes.length}
        </button>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { doc, updateDoc, arrayUnion, arrayRemove, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import StarRating from './StarRating';

export default function ReviewItem({ review, showMovieLink = false, movieTitle = 'a movie', onDelete, onUpdate }) {
  const { currentUser } = useAuth();
  const [likes, setLikes] = useState(review.likedBy || []);
  const [isLiking, setIsLiking] = useState(false);
  const [isSpoilerRevealed, setIsSpoilerRevealed] = useState(false);

  const hasLiked = currentUser ? likes.includes(currentUser.uid) : false;
  const isAuthor = currentUser && currentUser.uid === review.userId;

  const [isEditing, setIsEditing] = useState(false);
  const [editRating, setEditRating] = useState(review.rating);
  const [editReviewText, setEditReviewText] = useState(review.reviewText);
  const [editContainsSpoilers, setEditContainsSpoilers] = useState(review.containsSpoilers || false);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this review?")) {
      try {
        await deleteDoc(doc(db, 'reviews', review.id));
        if (onDelete) onDelete(review.id);
      } catch (err) {
        console.error("Error deleting review:", err);
      }
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      const updatedData = {
        rating: editRating,
        reviewText: editReviewText,
        containsSpoilers: editContainsSpoilers
      };
      await updateDoc(doc(db, 'reviews', review.id), updatedData);
      if (onUpdate) {
        onUpdate({ ...review, ...updatedData });
      } else {
        // If no onUpdate is provided, just mutate the prop object locally for optimistic UI
        // In a real app, it's better to rely on state flowing from parent, but this works well enough
        Object.assign(review, updatedData);
      }
      setIsEditing(false);
    } catch (err) {
      console.error("Error updating review:", err);
    }
    setIsUpdating(false);
  };

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
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
          <span style={{ color: 'var(--muted-text)', fontSize: '14px' }}>{new Date(review.createdAt).toLocaleDateString()}</span>
          {isAuthor && !isEditing && (
            <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
              <button onClick={() => setIsEditing(true)} style={{ background: 'none', border: 'none', color: '#007bff', cursor: 'pointer', fontSize: '14px', padding: 0 }}>Edit</button>
              <button onClick={handleDelete} style={{ background: 'none', border: 'none', color: '#dc3545', cursor: 'pointer', fontSize: '14px', padding: 0 }}>Delete</button>
            </div>
          )}
        </div>
      </div>

      {isEditing ? (
        <form onSubmit={handleUpdate} style={{ marginBottom: '15px' }}>
          <div style={{ marginBottom: '10px' }}>
            <StarRating rating={editRating} setRating={setEditRating} />
          </div>
          <textarea 
            rows="3" 
            value={editReviewText}
            onChange={(e) => setEditReviewText(e.target.value)}
            style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid var(--input-border)', backgroundColor: 'var(--input-bg)', color: 'var(--text-color)', boxSizing: 'border-box', marginBottom: '10px' }}
          />
          <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input 
              type="checkbox" 
              id={`edit-spoilers-${review.id}`}
              checked={editContainsSpoilers}
              onChange={(e) => setEditContainsSpoilers(e.target.checked)}
            />
            <label htmlFor={`edit-spoilers-${review.id}`}>Contains Spoilers</label>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button disabled={isUpdating} type="submit" style={{ padding: '6px 12px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
              {isUpdating ? 'Saving...' : 'Save'}
            </button>
            <button type="button" onClick={() => {
              setIsEditing(false);
              setEditRating(review.rating);
              setEditReviewText(review.reviewText);
              setEditContainsSpoilers(review.containsSpoilers || false);
            }} style={{ padding: '6px 12px', backgroundColor: 'var(--header-bg)', color: 'var(--text-color)', border: '1px solid var(--border-color)', borderRadius: '4px', cursor: 'pointer' }}>
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <>
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
        </>
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

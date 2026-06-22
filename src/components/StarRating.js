import React, { useState } from 'react';

export default function StarRating({ rating, setRating, readOnly = false }) {
  const [hover, setHover] = useState(0);

  return (
    <div style={{ display: 'flex', gap: '5px' }}>
      {[...Array(5)].map((star, index) => {
        const indexValue = index + 1;
        return (
          <button
            type="button"
            key={indexValue}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              outline: 'none',
              cursor: readOnly ? 'default' : 'pointer',
              color: indexValue <= (hover || rating) ? '#ffc107' : '#e4e5e9',
              fontSize: '24px',
              padding: 0
            }}
            onClick={() => !readOnly && setRating(indexValue)}
            onMouseEnter={() => !readOnly && setHover(indexValue)}
            onMouseLeave={() => !readOnly && setHover(rating)}
            disabled={readOnly}
          >
            &#9733;
          </button>
        );
      })}
    </div>
  );
}

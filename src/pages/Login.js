import React, { useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

export default function Login() {
  const emailRef = useRef();
  const passwordRef = useRef();
  const { login } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      setError('');
      setLoading(true);
      await login(emailRef.current.value, passwordRef.current.value);
      navigate('/profile');
    } catch (err) {
      setError('Failed to log in: ' + err.message);
    }

    setLoading(false);
  }

  return (
    <div style={{ maxWidth: '400px', margin: '40px auto', padding: '20px', border: '1px solid var(--border-color)', backgroundColor: 'var(--card-bg-color)', borderRadius: '8px' }}>
      <h2 style={{ textAlign: 'center' }}>Log In</h2>
      {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div>
          <label>Email</label>
          <input type="email" ref={emailRef} required style={{ width: '100%', padding: '8px', marginTop: '5px', border: '1px solid var(--input-border)', backgroundColor: 'var(--input-bg)', color: 'var(--text-color)', boxSizing: 'border-box', borderRadius: '4px' }} />
        </div>
        <div>
          <label>Password</label>
          <input type="password" ref={passwordRef} required style={{ width: '100%', padding: '8px', marginTop: '5px', border: '1px solid var(--input-border)', backgroundColor: 'var(--input-bg)', color: 'var(--text-color)', boxSizing: 'border-box', borderRadius: '4px' }} />
        </div>
        <button disabled={loading} type="submit" style={{ padding: '10px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          Log In
        </button>
      </form>
      <div style={{ marginTop: '20px', textAlign: 'center' }}>
        Need an account? <Link to="/signup">Sign Up</Link>
      </div>
    </div>
  );
}

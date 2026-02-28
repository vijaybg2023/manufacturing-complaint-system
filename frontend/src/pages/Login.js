import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signInWithGoogle, signInWithEmail } = useAuth();
  const navigate = useNavigate();

  const s = { card: { maxWidth: 400, margin: '100px auto', padding: 32, background: '#fff', borderRadius: 8, boxShadow: '0 4px 24px rgba(0,0,0,0.1)', fontFamily: 'system-ui' }, title: { fontSize: 24, fontWeight: 700, color: '#1e3a5f', marginBottom: 8 }, input: { width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: 6, fontSize: 14, marginBottom: 12, boxSizing: 'border-box' }, btn: { width: '100%', padding: '11px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600, marginBottom: 10 } };

  async function handleEmailLogin(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await signInWithEmail(email, password);
      navigate('/');
    } catch (err) {
      toast.error(err.message || 'Login failed');
    }
    setLoading(false);
  }

  async function handleGoogleLogin() {
    setLoading(true);
    try {
      await signInWithGoogle();
      navigate('/');
    } catch (err) {
      toast.error(err.message || 'Google sign-in failed');
    }
    setLoading(false);
  }

  return (
    <div style={{ background: '#f0f4f8', minHeight: '100vh' }}>
      <div style={s.card}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={s.title}>Manufacturing QMS</div>
          <div style={{ fontSize: 13, color: '#666' }}>ISO 9001 / IATF 16949 Complaint Handling</div>
        </div>
        <form onSubmit={handleEmailLogin}>
          <input style={s.input} type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
          <input style={s.input} type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
          <button style={{ ...s.btn, background: '#1e3a5f', color: '#fff' }} type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <div style={{ textAlign: 'center', color: '#999', fontSize: 12, margin: '8px 0' }}>or</div>
        <button onClick={handleGoogleLogin} style={{ ...s.btn, background: '#fff', color: '#333', border: '1px solid #ddd' }} disabled={loading}>
          Sign in with Google
        </button>
      </div>
    </div>
  );
}

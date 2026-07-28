import React, { useState } from 'react';
import API from '../services/api';
import novaLogo from '../assets/logo.png';

export default function Login({ onLoginSuccess, setView }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      alert("Please fill all fields");
      return;
    }

    try {
      setLoading(true);
      
      // Payload structure matching backend authRoutes
      const payload = { email, password };
      console.log("Sending Login Data:", payload);
      
      // Endpoint target route: https://novaconnect-uowz.onrender.com/api/v1/auth/login
      const res = await API.post('/auth/login', payload);
      console.log("Response from server:", res.data);

      if (res.data && res.data.data) {
        const token = res.data.data.accessToken;
        const user = res.data.data.user;

      if (token) {
          // Local storage me physical string synchronization
          localStorage.setItem('token', token);
          if (user && user._id) {
            localStorage.setItem('userId', user._id);
          }
        alert("Login Successful!");
        onLoginSuccess();
      } else {
        alert("Backend hit successful, but no token received. Check console!");
      }
      } else {
        alert("Server responded with unexpected envelope structure.");
      }
    } catch (err) {
      console.error("Full Login Error:", err);
      
      // Backend agar koi custom error message de raha hai toh wo dikhayega
      if (err.response && err.response.data && err.response.data.message) {
        alert(`Login Failed: ${err.response.data.message}`);
      } else {
        alert("Login Failed: Credentials mismatch or Network Issue.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', backgroundColor: '#111b21', height: '100vh', width: '100vw', boxSizing: 'border-box' }}>
      <img 
  src="/logo.png" 
  alt="NovaConnect Logo" 
  style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover', marginBottom: '16px' }} 
/>
      
      <h2 style={{ color: '#e9edef', margin: '0 0 24px 0', fontSize: '20px', fontFamily: 'sans-serif' }}>Sign in to NovaConnect</h2>
      
      <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: '320px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <input 
          type="email" 
          placeholder="Email address" 
          value={email} 
          onChange={e => setEmail(e.target.value)} 
          style={{ width: '100%', padding: '12px', backgroundColor: '#2a3942', border: 'none', borderRadius: '8px', color: 'white', outline: 'none', boxSizing: 'border-box' }} 
        />
        <input 
          type="password" 
          placeholder="Password" 
          value={password} 
          onChange={e => setPassword(e.target.value)} 
          style={{ width: '100%', padding: '12px', backgroundColor: '#2a3942', border: 'none', borderRadius: '8px', color: 'white', outline: 'none', boxSizing: 'border-box' }} 
        />
        
        <button 
          type="submit" 
          disabled={loading}
          style={{ width: '100%', padding: '12px', backgroundColor: loading ? '#164e37' : '#1fa855', color: 'white', border: 'none', borderRadius: '24px', fontWeight: 'bold', cursor: loading ? 'not-allowed' : 'pointer', marginTop: '12px' }}
        >
          {loading ? 'Logging in...' : 'Log In'}
        </button>
      </form>

      <p style={{ color: '#8696a0', marginTop: '20px', fontSize: '14px', fontFamily: 'sans-serif' }}>
        Don't have an account?{' '}
        <span onClick={() => setView('signup')} style={{ color: '#1fa855', cursor: 'pointer', fontWeight: 'bold' }}>
          Sign Up
        </span>
      </p>
    </div>
  );
}
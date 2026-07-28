// src/pages/Signup.jsx
import React, { useState } from 'react';
import API from '../services/api';

export default function Signup({ setView }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState(''); // 👈 New State for Confirmation
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password || !confirmPassword) {
      alert("Please fill all fields");
      return;
    }

    if (password !== confirmPassword) {
      alert("Frontend Check: Passwords do not match!");
      return;
    }

    try {
      setLoading(true);
      
      // 💡 PAYLOAD FIX: Hum password aur passwordConfirm/confirmPassword dono bhej rahe hain 
      // taaki aapke backend validation ko jo key chahiye (confirmPassword ya passwordConfirm) wo mil jaye!
      const payload = { 
        name: name.trim(), 
        username: name.trim(), 
        email: email.trim(), 
        password: password,
        confirmPassword: confirmPassword,     // 👈 Backend option 1
        passwordConfirm: confirmPassword      // 👈 Backend option 2 (Mongoose standard)
      };

      console.log("Sending Signup Data:", payload);
      
      const res = await API.post('/auth/register', payload);
      console.log("Signup Server Response:", res.data);

      alert("Registration Successful! Now please Log In.");
      setView('login'); // Automatically switches to login screen

    } catch (err) {
      console.error("Full Signup Error:", err);
      if (err.response && err.response.data && (err.response.data.message || err.response.data.error)) {
        alert(`Signup Failed: ${err.response.data.message || err.response.data.error}`);
      } else {
        alert("Signup Failed: Network Error or Server is Down.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', backgroundColor: '#111b21', height: '100vh', width: '100vw', boxSizing: 'border-box' }}>
      <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: '#1fa855', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>W</div>
      
      <h2 style={{ color: '#e9edef', margin: '0 0 24px 0', fontSize: '20px', fontFamily: 'sans-serif' }}>Create WhatsApp Account</h2>
      
      <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: '320px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <input 
          type="text" 
          placeholder="Full Name / Username" 
          value={name} 
          onChange={e => setName(e.target.value)} 
          style={{ width: '100%', padding: '12px', backgroundColor: '#2a3942', border: 'none', borderRadius: '8px', color: 'white', outline: 'none', boxSizing: 'border-box' }} 
        />
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
        {/* 👈 Naya Input Box for Confirm Password */}
        <input 
          type="password" 
          placeholder="Confirm Password" 
          value={confirmPassword} 
          onChange={e => setConfirmPassword(e.target.value)} 
          style={{ width: '100%', padding: '12px', backgroundColor: '#2a3942', border: 'none', borderRadius: '8px', color: 'white', outline: 'none', boxSizing: 'border-box' }} 
        />
        
        <button 
          type="submit" 
          disabled={loading}
          style={{ width: '100%', padding: '12px', backgroundColor: loading ? '#164e37' : '#1fa855', color: 'white', border: 'none', borderRadius: '24px', fontWeight: 'bold', cursor: loading ? 'not-allowed' : 'pointer', marginTop: '12px' }}
        >
          {loading ? 'Registering...' : 'Sign Up'}
        </button>
      </form>

      <p style={{ color: '#8696a0', marginTop: '20px', fontSize: '14px', fontFamily: 'sans-serif' }}>
        Already have an account?{' '}
        <span onClick={() => setView('login')} style={{ color: '#1fa855', cursor: 'pointer', fontWeight: 'bold' }}>
          Log In
        </span>
      </p>
    </div>
  );
}
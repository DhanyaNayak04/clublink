import React, { useState } from 'react';
import api from '../api';
import { useNavigate, Link } from 'react-router-dom';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const response = await api.post('/api/auth/login', {
        email: email.trim(),
        password,
        role
      });
      
      // Save token and redirect
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('userRole', response.data.role);
      
      // Route to appropriate dashboard
      if (response.data.role === 'admin') {
        navigate('/admin');
      } else if (response.data.role === 'coordinator') {
        navigate('/coordinator');
      } else if (response.data.role === 'student') {
        navigate('/student');
      } else {
        navigate('/');
      }
    } catch (err) {
      console.log('Login error:', err);
      setError(err.response?.data?.message || 'Failed to login. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '40px auto', padding: 20, border: '1px solid #ccc' }}>
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ textAlign: 'center', margin: 0 }}>Login</h2>
        <Link to="/" style={{ color: '#2196F3', textDecoration: 'none' }}>← Go to Home</Link>
      </div>
      
      {error && (
        <div style={{ backgroundColor: '#ffebee', color: '#c62828', padding: '0.75rem', marginBottom: '1rem', borderRadius: '4px' }}>
          {error}
        </div>
      )}
      
      <form onSubmit={handleLogin}>
        <div style={{ marginBottom: 15 }}>
          <label>Email:</label><br />
          <input 
            type="email" 
            value={email} 
            onChange={e => setEmail(e.target.value)} 
            required 
            style={{ width: '100%', padding: '8px' }}
          />
        </div>
        
        <div style={{ marginBottom: 15 }}>
          <label>Password:</label><br />
          <input 
            type="password" 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            required 
            style={{ width: '100%', padding: '8px' }}
          />
        </div>
        
        <div style={{ marginBottom: '1.5rem' }}>
          <label htmlFor="role" style={{ display: 'block', marginBottom: '0.5rem' }}>Role</label>
          <select
            id="role"
            name="role"
            value={role}
            onChange={e => setRole(e.target.value)}
            style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
          >
            <option value="student">Student</option>
            <option value="coordinator">Coordinator</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        
        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '0.75rem',
            backgroundColor: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1
          }}
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
      
      <div style={{ marginTop: '1rem', textAlign: 'center' }}>
        <p>Don't have an account? <Link to="/signup" style={{ color: '#2196F3' }}>Sign up here</Link></p>
      </div>
    </div>
  );
}

export default Login;

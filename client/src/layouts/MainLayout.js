import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';

function MainLayout({ children }) {
  // Use the AuthContext directly to avoid any import issues
  const { isAuthenticated, user, logout } = useContext(AuthContext);

  return (
    <div className="main-layout">
      <header>
        <nav style={{ 
          padding: '1rem', 
          backgroundColor: '#2196F3', 
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <Link to="/" style={{ color: 'white', fontSize: '1.2rem', fontWeight: 'bold' }}>
              College Club Management
            </Link>
          </div>
          
          <div style={{ display: 'flex', gap: '1rem' }}>
            <Link to="/" style={{ color: 'white' }}>Home</Link>
            
            {isAuthenticated && user ? (
              <>
                <Link to={`/${user.role || 'student'}`} style={{ color: 'white' }}>Dashboard</Link>
                <button 
                  onClick={logout} 
                  style={{ 
                    background: 'transparent', 
                    border: 'none', 
                    color: 'white', 
                    cursor: 'pointer' 
                  }}
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" style={{ color: 'white' }}>Login</Link>
                <Link to="/register" style={{ color: 'white' }}>Register</Link>
              </>
            )}
          </div>
        </nav>
      </header>
      
      <main style={{ padding: '1rem' }}>
        {children}
      </main>
      
      {/* Remove footer here since we're using the Footer component from App.js */}
    </div>
  );
}

export default MainLayout;

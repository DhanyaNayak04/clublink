import React from 'react';
import { useNavigate } from 'react-router-dom';

function LogoutButton({ style }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Remove auth token and other user data
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    
    // Redirect to login page
    navigate('/login');
  };

  const buttonStyle = {
    padding: '8px 15px',
    backgroundColor: '#f44336',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 'bold',
    ...style
  };

  return (
    <button onClick={handleLogout} style={buttonStyle}>
      Logout
    </button>
  );
}

export default LogoutButton;

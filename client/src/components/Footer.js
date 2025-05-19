import React from 'react';

function Footer() {
  return (
    <footer style={{ 
      backgroundColor: '#f5f5f5', 
      padding: '1rem',
      textAlign: 'center',
      borderTop: '1px solid #ddd',
      marginTop: 'auto'
    }}>
      <p>© {new Date().getFullYear()} College Clubs Management System</p>
      <div style={{ marginTop: '10px', fontSize: '0.9rem' }}>
        <a href="#" style={{ color: '#666', marginRight: '15px', textDecoration: 'none' }}>Privacy Policy</a>
        <a href="#" style={{ color: '#666', marginRight: '15px', textDecoration: 'none' }}>Terms of Service</a>
        <a href="#" style={{ color: '#666', textDecoration: 'none' }}>Contact Us</a>
      </div>
    </footer>
  );
}

export default Footer;

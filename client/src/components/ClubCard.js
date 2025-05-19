import React from 'react';
import { useNavigate } from 'react-router-dom';

function ClubCard({ club }) {
  const navigate = useNavigate();
  
  // For logo display - use default logo if logoUrl doesn't exist or fails to load
  const [logoError, setLogoError] = React.useState(false);
  
  // Default logo style
  const logoStyle = {
    width: 100,
    height: 100,
    objectFit: 'cover',
    borderRadius: '8px',
    marginBottom: '10px',
    backgroundColor: '#f0f0f0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  };
  
  // Club initial for fallback logo
  const clubInitial = club.name ? club.name.charAt(0).toUpperCase() : 'C';
  
  return (
    <div style={{ 
      border: '1px solid #e0e0e0', 
      borderRadius: '10px',
      margin: 10, 
      padding: 15, 
      width: 200,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
      transition: 'transform 0.2s',
      cursor: 'pointer',
      backgroundColor: 'white',
      overflow: 'hidden'
    }}
    onClick={() => navigate(`/club/${club._id}`)}
    onMouseOver={(e) => {e.currentTarget.style.transform = 'translateY(-5px)';}}
    onMouseOut={(e) => {e.currentTarget.style.transform = 'translateY(0)';}}
    >
      {/* Logo with fallback */}
      {!logoError && club.logoUrl ? (
        <img 
          src={`${process.env.REACT_APP_API_URL || ''}${club.logoUrl}`} 
          alt={club.name}
          style={logoStyle}
          onError={() => setLogoError(true)} 
        />
      ) : (
        <div style={{
          ...logoStyle,
          fontSize: '2.5rem',
          fontWeight: 'bold',
          color: '#555',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {clubInitial}
        </div>
      )}
      
      {/* Club name */}
      <h3 style={{ 
        margin: '10px 0', 
        fontSize: '1.2rem',
        textAlign: 'center',
        fontWeight: '600',
        color: '#333'
      }}>
        {club.name}
      </h3>
      
      {/* View button */}
      <button 
        onClick={(e) => {
          e.stopPropagation(); // Prevent card click event
          navigate(`/club/${club._id}`);
        }}
        style={{
          padding: '8px 15px',
          backgroundColor: '#1976d2',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontWeight: '500',
          marginTop: '5px'
        }}
      >
        View Club
      </button>
    </div>
  );
}

export default ClubCard;

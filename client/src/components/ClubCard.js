import React from 'react';
import { useNavigate } from 'react-router-dom';

function ClubCard({ club }) {
  const navigate = useNavigate();
  const [logoError, setLogoError] = React.useState(false);
  
  // Club initial for fallback logo
  const clubInitial = club.name ? club.name.charAt(0).toUpperCase() : 'C';
  
  return (
    <div style={{ 
      width: '280px',            // Consistent width
      height: '380px',           // Consistent height
      borderRadius: '8px',
      boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      transition: 'transform 0.3s ease, box-shadow 0.3s',
      cursor: 'pointer',
      background: 'white',
      border: '1px solid #eaeaea',
    }}
    onClick={() => navigate(`/club/${club._id}`)}
    onMouseOver={(e) => {
      e.currentTarget.style.transform = 'translateY(-6px)';
      e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.15)';
    }}
    onMouseOut={(e) => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
    }}
    >
      {/* Logo with fallback */}
      <div style={{ 
        height: '150px',
        overflow: 'hidden',
      }}>
        {!logoError && club.logoUrl ? (
          <img 
            src={`${process.env.REACT_APP_API_URL || ''}${club.logoUrl}`} 
            alt={club.name}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              borderRadius: '8px 8px 0 0',
            }}
            onError={() => setLogoError(true)} 
          />
        ) : (
          <div style={{
            width: '100%',
            height: '100%',
            backgroundColor: '#af984c',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '3rem',
            fontWeight: 'bold',
            borderRadius: '8px 8px 0 0',
          }}>
            {clubInitial}
          </div>
        )}
      </div>
      
      <div style={{ padding: '15px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Club name */}
        <h3 style={{ 
          margin: '0 0 10px 0', 
          fontSize: '1.2rem',
          color: '#333',
          textAlign: 'center',
        }}>
          {club.name}
        </h3>
        
        {/* Club description */}
        <div style={{ 
          flex: 1,
          overflow: 'auto',
          fontSize: '0.9rem',
          color: '#666',
          lineHeight: '1.5',
          marginBottom: '15px',
        }}>
          <p style={{ margin: 0 }}>
            {club.description || 'No description available.'}
          </p>
        </div>
        
        {/* View button */}
        <button 
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/club/${club._id}`);
          }}
          style={{
            width: '100%',
            padding: '10px',
            backgroundColor: '#af984c',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontWeight: '600',
            textAlign: 'center',
            transition: 'background-color 0.2s',
            cursor: 'pointer',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = '#8e7d3f';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = '#af984c';
          }}
        >
          View Club
        </button>
      </div>
    </div>
  );
}

export default ClubCard;

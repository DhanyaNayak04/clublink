import React, { useEffect, useState, useRef } from 'react';
import api from '../api';
import ClubCard from '../components/ClubCard';

function Home() {
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scrollPosition, setScrollPosition] = useState(0);
  const clubsContainerRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get('/api/clubs');
        setClubs(res.data);
      } catch (err) {
        setClubs([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const scrollLeft = () => {
    if (clubsContainerRef.current) {
      const newPosition = scrollPosition - 270; // Card width + margin
      clubsContainerRef.current.scrollTo({
        left: newPosition,
        behavior: 'smooth'
      });
      setScrollPosition(newPosition);
    }
  };

  const scrollRight = () => {
    if (clubsContainerRef.current) {
      const newPosition = scrollPosition + 270; // Card width + margin
      clubsContainerRef.current.scrollTo({
        left: newPosition,
        behavior: 'smooth'
      });
      setScrollPosition(newPosition);
    }
  };

  const handleScroll = () => {
    if (clubsContainerRef.current) {
      setScrollPosition(clubsContainerRef.current.scrollLeft);
    }
  };

  return (
    <div style={{ 
      maxWidth: 1200, 
      margin: '30px auto', 
      padding: '20px',
      background: 'linear-gradient(135deg, #fff 60%, #af984c 100%)',
      borderRadius: '18px',
      boxShadow: '0 8px 32px 0 #000a28e6'
    }}>
      <h2 style={{ textAlign: 'center', marginBottom: 30, color: '#512da8', letterSpacing: 2, fontWeight: 700, fontSize: '2.2rem', textShadow: '0 2px 8px #ffd70055' }}>Explore Clubs</h2>
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}>Loading clubs...</div>
      ) : (
        <div style={{ position: 'relative', padding: '0 30px' }}>
          {clubs.length > 4 && (
            <>
              <button 
                onClick={scrollLeft}
                disabled={scrollPosition <= 0}
                style={{
                  position: 'absolute',
                  left: '-15px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  zIndex: 10,
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: scrollPosition <= 0 ? '#ccc' : '#af984c',
                  color: 'white',
                  border: 'none',
                  fontSize: '20px',
                  cursor: scrollPosition <= 0 ? 'default' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                }}
              >
                ←
              </button>
              <button 
                onClick={scrollRight}
                disabled={clubsContainerRef.current && scrollPosition >= clubsContainerRef.current.scrollWidth - clubsContainerRef.current.clientWidth}
                style={{
                  position: 'absolute',
                  right: '-15px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  zIndex: 10,
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: clubsContainerRef.current && scrollPosition >= clubsContainerRef.current.scrollWidth - clubsContainerRef.current.clientWidth ? '#ccc' : '#af984c',
                  color: 'white',
                  border: 'none',
                  fontSize: '20px',
                  cursor: clubsContainerRef.current && scrollPosition >= clubsContainerRef.current.scrollWidth - clubsContainerRef.current.clientWidth ? 'default' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                }}
              >
                →
              </button>
            </>
          )}
          <div 
            ref={clubsContainerRef}
            onScroll={handleScroll}
            style={{
              display: 'flex',
              overflowX: 'auto',
              scrollbarWidth: 'none', // Hide scrollbar for Firefox
              msOverflowStyle: 'none', // Hide scrollbar for IE
              paddingBottom: '20px',
              paddingTop: '20px',
              gap: '40px', // Increased gap between cards
              scrollBehavior: 'smooth',
              justifyContent: clubs.length <= 4 ? 'center' : 'flex-start', // Center when fewer cards
            }}
          >
            {clubs.map(club => (
              <div key={club._id}>
                <ClubCard club={club} />
              </div>
            ))}
          </div>
          {/* Hide scrollbar for Chrome, Safari and Opera */}
          <style>
            {`
              div::-webkit-scrollbar {
                display: none;
              }
            `}
          </style>
        </div>
      )}
    </div>
  );
}

export default Home;

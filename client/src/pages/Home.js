import React, { useEffect, useState } from 'react';
import api from '../api';
import ClubCard from '../components/ClubCard';

function Home() {
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div style={{ maxWidth: 1200, margin: '30px auto', padding: '0 16px' }}>
      <h2 style={{ textAlign: 'center', marginBottom: 30 }}>Explore Clubs</h2>
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}>Loading clubs...</div>
      ) : (
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 24,
          justifyContent: 'center'
        }}>
          {clubs.map(club => (
            <ClubCard key={club._id} club={club} />
          ))}
        </div>
      )}
    </div>
  );
}

export default Home;

import React, { useEffect, useState, useCallback } from 'react';
import api from '../api';
import LogoutButton from '../components/LogoutButton';
import { useNavigate, useLocation } from 'react-router-dom';
import Certificate from '../components/Certificate';

function StudentDashboard() {
  const [profile, setProfile] = useState({});
  const [events, setEvents] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCertificate, setShowCertificate] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Define handleViewCertificate with useCallback BEFORE using it in useEffect
  const handleViewCertificate = useCallback((event) => {
    console.log('Viewing certificate for event:', event);
    setSelectedCertificate(event);
    setShowCertificate(true);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Get user profile
        const profileRes = await api.get('/api/users/me');
        setProfile(profileRes.data);
        
        // Get registered events
        try {
          const eventsRes = await api.get('/api/users/my-events');
          setEvents(eventsRes.data);
        } catch (eventError) {
          console.log('Could not fetch events:', eventError);
          setEvents([]);
        }
        
        // Get certificates
        try {
          const certRes = await api.get('/api/users/certificates');
          setCertificates(certRes.data);
          console.log('Certificates loaded:', certRes.data);
        } catch (certError) {
          console.log('Could not fetch certificates:', certError);
          setCertificates([]);
        }
        
      } catch (err) {
        console.error('Error fetching student data:', err);
        setError('Failed to load your profile data');
        
        // If authentication error, redirect to login
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [navigate]);

  // Separate useEffect to handle URL params after events are loaded
  useEffect(() => {
    // Check if we should show a certificate from URL params
    const params = new URLSearchParams(location.search);
    if (params.get('certificate') === 'true') {
      const eventId = params.get('eventId');
      const eventIndex = events.findIndex(e => e._id === eventId);
      
      if (eventIndex >= 0) {
        handleViewCertificate(events[eventIndex]);
      }
    }
  }, [location.search, events, handleViewCertificate]);

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '50px' }}>Loading...</div>;
  }

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Student Dashboard</h2>
        <LogoutButton />
      </div>
      
      {error && (
        <div style={{ padding: '10px', backgroundColor: '#ffeeee', color: '#cc0000', borderRadius: '5px', marginBottom: '20px' }}>
          {error}
        </div>
      )}
      
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '30px', padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
        {/* Use a default avatar instead of trying to load from profile */}
        <div 
          style={{ 
            width: 80, 
            height: 80, 
            borderRadius: '50%', 
            backgroundColor: '#e0e0e0', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            marginRight: 20,
            fontSize: '2em',
            color: '#555'
          }}
        >
          {profile.name ? profile.name.charAt(0).toUpperCase() : '?'}
        </div>
        <div>
          <h3 style={{ margin: '0 0 10px 0' }}>{profile.name}</h3>
          <p style={{ margin: '0' }}><b>Email:</b> {profile.email}</p>
          <p style={{ margin: '5px 0 0 0' }}><b>Department:</b> {profile.department || 'Not specified'}</p>
        </div>
      </div>
      
      <h3>Recently Participated Events</h3>
      {events.length === 0 ? (
        <p>You haven't participated in any events yet.</p>
      ) : (
        <ul style={{ listStyleType: 'none', padding: 0 }}>
          {events.map((ev, index) => (
            <li 
              key={ev._id || index} 
              style={{ padding: '10px', marginBottom: '10px', border: '1px solid #ddd', borderRadius: '5px' }}
            >
              {ev.title || 'Event'} - {ev.date ? new Date(ev.date).toLocaleString() : 'Date not available'}
            </li>
          ))}
        </ul>
      )}
      
      <h3>My Certificates</h3>
      {certificates.length === 0 ? (
        <p>No certificates available yet. Participate in events to earn certificates!</p>
      ) : (
        <ul style={{ listStyleType: 'none', padding: 0 }}>
          {certificates.map((cert) => (
            <li 
              key={cert._id}
              style={{ padding: '15px', marginBottom: '10px', border: '1px solid #ddd', borderRadius: '5px' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ margin: '0 0 8px 0' }}>{cert.eventTitle || 'Event Certificate'}</h4>
                  <p style={{ margin: 0, color: '#666' }}>
                    Issued on: {new Date(cert.issueDate).toLocaleDateString()}
                  </p>
                  <p style={{ margin: 0, color: '#666', fontSize: '0.9em' }}>
                    Certificate ID: {cert.certificateId}
                  </p>
                  <p style={{ margin: '5px 0 0', color: '#666' }}>
                    Organized by: {cert.clubName}
                  </p>
                </div>
                <button
                  onClick={() => {
                    // Create certificate object with event data for certificate view
                    const certEvent = {
                      title: cert.eventTitle,
                      date: cert.date,
                      _id: cert.eventId,
                      clubName: cert.clubName
                    };
                    handleViewCertificate(certEvent);
                  }}
                  style={{
                    padding: '8px 12px',
                    backgroundColor: '#2196F3',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  View Certificate
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      
      {/* Certificate Modal */}
      {showCertificate && selectedCertificate && (
        <Certificate 
          student={profile}
          event={selectedCertificate}
          onClose={() => setShowCertificate(false)}
        />
      )}
    </div>
  );
}

export default StudentDashboard;

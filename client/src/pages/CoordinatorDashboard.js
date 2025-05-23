import React, { useEffect, useState } from 'react';
import api from '../api';
import LogoutButton from '../components/LogoutButton';
import AttendanceModal from '../components/AttendanceModal';
import Certificate from '../components/Certificate';

function CoordinatorDashboard() {
  const [events, setEvents] = useState([]);
  const [venueRequest, setVenueRequest] = useState({
    venue: '',
    eventName: '',
    eventDate: '',
    timeFrom: '',
    timeTo: '',
    eventDescription: ''
  });
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    date: '',
    venueRequestId: ''
  });
  const [pendingVenueRequests, setPendingVenueRequests] = useState([]);
  const [approvedVenues, setApprovedVenues] = useState([]);
  const [club, setClub] = useState(null);
  const [editingClub, setEditingClub] = useState(false);
  const [clubDescription, setClubDescription] = useState('');
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [showCertificate, setShowCertificate] = useState(false);
  const [attendanceEventId, setAttendanceEventId] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedEventForCertificate, setSelectedEventForCertificate] = useState(null);

  const fetchVenueRequests = async () => {
    try {
      console.log('Fetching venue requests...');
      const res = await api.get('/api/events/venue-requests');
      console.log('Venue requests data:', res.data);

      const approved = [];
      const pending = [];

      res.data.forEach(req => {
        console.log(`Request ${req._id} approval status:`, req.approved);
        if (req.approved === true) {
          approved.push(req);
        } else {
          pending.push(req);
        }
      });

      console.log(`Sorted ${approved.length} approved and ${pending.length} pending requests`);
      setApprovedVenues(approved);
      setPendingVenueRequests(pending);
    } catch (error) {
      console.error('Error fetching venue requests:', error);
    }
  };

  // When fetching events, also fetch registered students for each event
  const fetchEvents = async () => {
    try {
      // Fetch only events published by the logged-in coordinator
      const eventsResponse = await api.get('/api/events/my');
      const eventsWithRegistrations = await Promise.all(
        eventsResponse.data.map(async (event) => {
          // Fetch registered students for each event
          const registrationsRes = await api.get(`/api/events/${event._id}/registrations`);
          return { ...event, registrations: registrationsRes.data };
        })
      );
      setEvents(eventsWithRegistrations);
    } catch (err) {
      console.error('Failed to load events or registrations.', err);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get user profile first to access club ID
        const userProfileRes = await api.get('/api/users/me');
        console.log('Coordinator profile:', userProfileRes.data);
        
        // Check if club is associated
        if (!userProfileRes.data.club && userProfileRes.data.clubName) {
          console.warn('Coordinator has clubName but no club reference:', userProfileRes.data.clubName);
        }
        
        if (userProfileRes.data && userProfileRes.data.club) {
          const clubRes = await api.get(`/api/clubs/${userProfileRes.data.club._id}`);
          setClub(clubRes.data);
          setClubDescription(clubRes.data.description || '');
          console.log('Club data loaded:', clubRes.data);

          // Fetch only coordinator's events
          await fetchEvents();
        } else {
          // No club association found for coordinator
          setClub(null);
          await fetchEvents();
        }

        await fetchVenueRequests();
      } catch (error) {
        console.error('Error fetching coordinator data:', error);
      }
    };

    fetchData();

    const intervalId = setInterval(fetchData, 30000);

    return () => clearInterval(intervalId);
  }, []);

  const handleVenueRequestChange = (e) => {
    const { name, value } = e.target;
    setVenueRequest(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleVenueRequest = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/events/request-venue', venueRequest);
      alert('Venue request sent to admin!');
      setVenueRequest({
        venue: '',
        eventName: '',
        eventDate: '',
        timeFrom: '',
        timeTo: '',
        eventDescription: ''
      });

      await fetchVenueRequests();
    } catch (error) {
      alert('Failed to send venue request');
      console.error('Venue request error:', error);
    }
  };

  const handleEventFormChange = (e) => {
    const { name, value } = e.target;
    setEventForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePostEvent = async (e) => {
    e.preventDefault();
    try {
      if (!eventForm.venueRequestId) {
        alert('Please select an approved venue');
        return;
      }

      if (!eventForm.title || !eventForm.description) {
        alert('Please fill in all required fields');
        return;
      }

      // Find selected venue for debugging
      const selectedVenue = approvedVenues.find(v => v._id === eventForm.venueRequestId);
      console.log('Selected venue for event:', selectedVenue);

      // Prepare payload
      const eventData = {
        title: eventForm.title.trim(),
        description: eventForm.description.trim(),
        venueRequestId: eventForm.venueRequestId,
      };

      // Add date if specified
      if (eventForm.date) {
        eventData.date = eventForm.date;
      }

      console.log('Sending event data:', eventData);
      
      // Make API request
      const token = localStorage.getItem('token');
      const response = await api.post('/api/events', eventData, {
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Event created successfully:', response.data);
      
      // Reset form
      setEventForm({
        title: '',
        description: '',
        date: '',
        venueRequestId: ''
      });
      
      alert('Event posted successfully!');
      
      // Refresh events list
      await fetchEvents();
    } catch (error) {
      console.error('Error posting event:', error);
      
      let errorMessage = 'Failed to create event';
      if (error.response) {
        errorMessage = error.response.data.message || errorMessage;
      }
      
      alert(`Error: ${errorMessage}`);
    }
  };

  // Fix the handleUpdateClubDescription function
  const handleUpdateClubDescription = async (e) => {
    e.preventDefault();
    try {
      console.log('Updating club description:', clubDescription);
      
      // Add the club ID to the request if it exists
      if (!club || !club._id) {
        throw new Error('No club associated with your account');
      }
      
      const response = await api.put(`/api/clubs/${club._id}`, { 
        description: clubDescription 
      });
      
      console.log('Club update response:', response.data);

      // Update the local state with the response data
      setClub(response.data);
      setEditingClub(false);
      alert('Club description updated successfully');
    } catch (error) {
      console.error('Error updating club description:', error);
      
      let errorMessage = 'Failed to update club description';
      if (error.response) {
        errorMessage = error.response.data?.message || errorMessage;
      }
      
      alert(errorMessage);
    }
  };

  // Fix 1: Remove unused function or add eslint disable comment
  // eslint-disable-next-line no-unused-vars
  const handleGenerateCertificate = (student, event) => {
    setSelectedStudent(student);
    setSelectedEventForCertificate(event);
    setShowCertificate(true);
  };

  // Fix 2: Update handleAttendance to send the correct request
  const handleAttendance = (eventId) => {
    console.log(`Opening attendance modal for event ID: ${eventId}`);
    setAttendanceEventId(eventId);
    setShowAttendanceModal(true);
  };

  return (
    <div style={{ 
      padding: '24px', 
      maxWidth: '800px', 
      margin: '0 auto',
      background: 'linear-gradient(135deg, #fff 60%, #ffd70022 100%)',
      borderRadius: '18px',
      boxShadow: '0 8px 32px 0 #1a237e22'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Coordinator Dashboard</h2>
        <LogoutButton />
      </div>

      {club && (
        <div style={{ marginBottom: '30px', padding: '20px', border: '1px solid #ddd', borderRadius: '5px', backgroundColor: '#f9f9f9' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>Your Club: {club.name}</h3>
            <button 
              onClick={() => setEditingClub(!editingClub)}
              style={{ 
                padding: '5px 10px', 
                backgroundColor: '#2196F3', 
                color: 'white', 
                border: 'none', 
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              {editingClub ? 'Cancel' : 'Edit Description'}
            </button>
          </div>
          
          {editingClub ? (
            <form onSubmit={handleUpdateClubDescription}>
              <div style={{ marginTop: '10px', marginBottom: '10px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Club Description:</label>
                <textarea
                  style={{ width: '100%', padding: '8px', height: '100px' }}
                  value={clubDescription}
                  onChange={(e) => setClubDescription(e.target.value)}
                  required
                ></textarea>
              </div>
              
              <button
                type="submit"
                style={{ 
                  padding: '8px 15px', 
                  backgroundColor: '#4CAF50', 
                  color: 'white', 
                  border: 'none', 
                  cursor: 'pointer',
                  borderRadius: '4px'
                }}
              >
                Update Description
              </button>
            </form>
          ) : (
            <>
              <p><strong>Department:</strong> {club.department || 'N/A'}</p>
              <p><strong>Description:</strong> {club.description || 'No description available.'}</p>
            </>
          )}
        </div>
      )}

      <div style={{ marginBottom: '30px', padding: '20px', border: '1px solid #ddd', borderRadius: '5px' }}>
        <h3>Request for Venue</h3>
        <form onSubmit={handleVenueRequest}>
          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Event Name:</label>
            <input
              style={{ width: '100%', padding: '8px' }}
              type="text"
              name="eventName"
              value={venueRequest.eventName}
              onChange={handleVenueRequestChange}
              required
            />
          </div>

          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Venue:</label>
            <input
              style={{ width: '100%', padding: '8px' }}
              type="text"
              name="venue"
              value={venueRequest.venue}
              onChange={handleVenueRequestChange}
              required
            />
          </div>

          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Date:</label>
            <input
              style={{ width: '100%', padding: '8px' }}
              type="date"
              name="eventDate"
              value={venueRequest.eventDate}
              onChange={handleVenueRequestChange}
              required
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>From:</label>
              <input
                style={{ width: '100%', padding: '8px' }}
                type="time"
                name="timeFrom"
                value={venueRequest.timeFrom}
                onChange={handleVenueRequestChange}
                required
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>To:</label>
              <input
                style={{ width: '100%', padding: '8px' }}
                type="time"
                name="timeTo"
                value={venueRequest.timeTo}
                onChange={handleVenueRequestChange}
                required
              />
            </div>
          </div>

          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Description:</label>
            <textarea
              style={{ width: '100%', padding: '8px', height: '100px' }}
              name="eventDescription"
              value={venueRequest.eventDescription}
              onChange={handleVenueRequestChange}
              required
            ></textarea>
          </div>

          <button
            style={{ padding: '10px 15px', backgroundColor: '#4CAF50', color: 'white', border: 'none', cursor: 'pointer' }}
            type="submit"
          >
            Request Venue
          </button>
        </form>
      </div>

      {pendingVenueRequests.length > 0 && (
        <div style={{ marginBottom: '30px' }}>
          <h3>Pending Venue Requests</h3>
          <ul style={{ listStyleType: 'none', padding: 0 }}>
            {pendingVenueRequests.map(req => (
              <li key={req._id} style={{ padding: '10px', borderBottom: '1px solid #eee' }}>
                <strong>{req.eventName}</strong> at {req.venue} on {new Date(req.eventDate).toLocaleDateString()}
                <span style={{ marginLeft: '10px', color: 'orange', fontWeight: 'bold' }}>
                  Pending
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {approvedVenues.length > 0 && (
        <div style={{ marginBottom: '30px', padding: '20px', border: '1px solid #ddd', borderRadius: '5px', backgroundColor: '#f9fff9' }}>
          <h3>Approved Venues - Post Event</h3>
          <p>These venues have been approved and are ready for you to post events.</p>
          <form onSubmit={handlePostEvent}>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Select Approved Venue:</label>
              <select
                style={{ width: '100%', padding: '8px' }}
                name="venueRequestId"
                value={eventForm.venueRequestId}
                onChange={handleEventFormChange}
                required
              >
                <option value="">-- Select an approved venue --</option>
                {approvedVenues.map(venue => (
                  <option key={venue._id} value={venue._id}>
                    {venue.eventName} at {venue.venue} ({new Date(venue.eventDate).toLocaleDateString()})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Title:</label>
              <input
                style={{ width: '100%', padding: '8px' }}
                type="text"
                name="title"
                value={eventForm.title}
                onChange={handleEventFormChange}
                required
              />
            </div>

            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Description:</label>
              <textarea
                style={{ width: '100%', padding: '8px', height: '100px' }}
                name="description"
                value={eventForm.description}
                onChange={handleEventFormChange}
                required
              ></textarea>
            </div>

            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Date & Time (Optional - defaults to venue request):</label>
              <input
                style={{ width: '100%', padding: '8px' }}
                type="datetime-local"
                name="date"
                value={eventForm.date}
                onChange={handleEventFormChange}
              />
            </div>

            <button
              style={{ padding: '10px 15px', backgroundColor: '#2196F3', color: 'white', border: 'none', cursor: 'pointer' }}
              type="submit"
            >
              Post Event
            </button>
          </form>
        </div>
      )}

      <div>
        <h3>My Published Events</h3>
        {events.length === 0 ? (
          <p>No events published yet. Request venue approval and post events.</p>
        ) : (
          <ul style={{ listStyleType: 'none', padding: 0 }}>
            {events.map(event => (
              <li key={event._id} style={{ padding: '15px', marginBottom: '10px', border: '1px solid #ddd', borderRadius: '5px' }}>
                <h4>{event.title}</h4>
                <p><strong>Date:</strong> {new Date(event.date).toLocaleString()}</p>
                <p><strong>Venue:</strong> {event.venue}</p>

                {/* Take Attendance Button */}
                {!event.attendanceCompleted && (
                  <button
                    onClick={() => handleAttendance(event._id)}
                    style={{
                      padding: '8px 12px',
                      backgroundColor: '#FF5722',
                      color: 'white',
                      border: 'none',
                      cursor: 'pointer',
                      marginTop: '10px',
                      borderRadius: '4px'
                    }}
                  >
                    Take Attendance
                  </button>
                )}
                
                {event.attendanceCompleted && (
                  <span style={{
                    display: 'inline-block',
                    marginTop: '10px',
                    color: 'green',
                    fontWeight: 'bold'
                  }}>
                    Attendance Completed ✓
                  </span>
                )}

                {/* Display registered students for the event */}
                {event.registrations && event.registrations.length > 0 && (
                  <div style={{ marginTop: '10px', padding: '10px', border: '1px solid #e0e0e0', borderRadius: '4px', backgroundColor: '#f9f9f9' }}>
                    <strong>Registered Students:</strong>
                    <ul style={{ listStyleType: 'none', padding: 0, margin: 0 }}>
                      {event.registrations.map(student => (
                        <li key={student._id} style={{ padding: '5px 0' }}>
                          {student.name} ({student.email})
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
      
      {/* Certificate Modal */}
      {showCertificate && selectedStudent && selectedEventForCertificate && (
        <Certificate 
          student={selectedStudent}
          event={selectedEventForCertificate}
          onClose={() => setShowCertificate(false)}
        />
      )}
      
      {/* Attendance Modal */}
      {showAttendanceModal && attendanceEventId && (
        <AttendanceModal 
          eventId={attendanceEventId} 
          onClose={() => {
            setShowAttendanceModal(false);
            setAttendanceEventId(null);
            // Refresh events list to show updated attendance status
            fetchEvents();
          }}
        />
      )}
    </div>
  );
}

export default CoordinatorDashboard;
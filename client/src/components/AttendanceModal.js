import React, { useState, useEffect } from 'react';
import api from '../api';

function AttendanceModal({ eventId, onClose }) {
  const [attendees, setAttendees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchAttendees = async () => {
      try {
        setLoading(true);
        console.log(`Fetching attendees for event: ${eventId}`);
        
        // FIXED: Make sure we're getting the registrations instead of attendees
        // This provides the registered students, not the attendance records
        const response = await api.get(`/api/events/${eventId}/registrations`, {
          headers: { 
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        // Transform the response to match the expected attendees format
        const formattedAttendees = response.data.map(student => ({
          _id: student._id,
          name: student.name,
          email: student.email,
          department: student.department || 'N/A',
          present: false // Default to not present
        }));
        
        console.log('Attendees data:', formattedAttendees);
        setAttendees(formattedAttendees);
        setError('');
      } catch (err) {
        console.error('Error fetching attendees:', err);
        if (err.response && err.response.status === 403) {
          setError('You are not authorized to view attendees for this event. Please contact support.');
        } else {
          const errorMsg = err.response?.data?.message || 'Failed to load attendees list';
          setError(`${errorMsg} (${err.message})`);
        }
        setAttendees([]);
      } finally {
        setLoading(false);
      }
    };

    if (eventId) {
      fetchAttendees();
    } else {
      setError('No event ID provided');
      setLoading(false);
    }
  }, [eventId]);

  const handleAttendanceChange = async (userId, isPresent) => {
    try {
      // Update local state first for a responsive UI
      setAttendees(attendees.map(attendee => 
        attendee._id === userId ? { ...attendee, present: isPresent } : attendee
      ));
      
      // Debug the request being sent
      console.log(`Marking attendance for student ${userId} in event ${eventId} as ${isPresent ? 'present' : 'absent'}`);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      // Fix: Use the events endpoint instead of attendance endpoint which isn't working
      await api.post(`/api/events/${eventId}/mark-attendance`, {
        studentId: userId,
        present: isPresent
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Attendance marked successfully');
    } catch (err) {
      console.error('Error marking attendance:', err);
      
      // More detailed error logging to debug the issue
      if (err.response) {
        console.error('Error response:', err.response.status, err.response.data);
      }
      
      alert('Failed to mark attendance: ' + (err.response?.data?.message || err.message));
      
      // Revert the UI change on error
      setAttendees(attendees.map(attendee => 
        attendee._id === userId ? { ...attendee, present: !isPresent } : attendee
      ));
    }
  };

  const handleSubmitAttendance = async () => {
    try {
      setSubmitting(true);
      setError('');
      setSuccess('');

      // Check if at least one student is marked as present
      const presentCount = attendees.filter(a => a.present).length;
      if (presentCount === 0) {
        setError('Please mark at least one student as present before submitting');
        setSubmitting(false);
        return;
      }

      // Create a payload with the attendance data
      const attendanceData = {
        attendees: attendees.map(a => ({
          userId: a._id,
          present: a.present === true
        }))
      };

      console.log('Submitting attendance data:', attendanceData);

      // Fix: Change the API endpoint to match the server-side route
      const response = await api.post(`/api/events/${eventId}/submit-attendance`, attendanceData, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      console.log('Attendance submission response:', response.data);
      setSuccess(`Attendance submitted successfully! ${response.data.certificatesGenerated || 0} certificates will be generated.`);
      
      // After successful submission, close the modal after a delay
      setTimeout(() => {
        onClose();
      }, 3000);
      
    } catch (err) {
      console.error('Error submitting attendance:', err);
      setError(err.response?.data?.message || 'Failed to submit attendance');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 10, 40, 0.92)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '20px',
        maxWidth: '800px',
        width: '90%',
        maxHeight: '90vh',
        overflowY: 'auto',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0 }}>Take Attendance</h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
            }}
          >
            &times;
          </button>
        </div>

        {error && (
          <div style={{ 
            backgroundColor: '#ffebee', 
            color: '#c62828', 
            padding: '10px', 
            borderRadius: '4px', 
            marginBottom: '15px' 
          }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{ 
            backgroundColor: '#e8f5e9', 
            color: '#2e7d32', 
            padding: '10px', 
            borderRadius: '4px', 
            marginBottom: '15px' 
          }}>
            {success}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>Loading attendees...</div>
        ) : attendees.length === 0 ? (
          <p>No students have registered for this event.</p>
        ) : (
          <>
            <p style={{ marginBottom: '15px' }}>
              Mark attendance for each student. Certificates will be sent to students marked as present.
            </p>
            
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f5f5f5' }}>
                  <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Name</th>
                  <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Email</th>
                  <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Department</th>
                  <th style={{ padding: '10px', textAlign: 'center', borderBottom: '1px solid #ddd' }}>Attendance</th>
                </tr>
              </thead>
              <tbody>
                {attendees.map(attendee => (
                  <tr key={attendee._id}>
                    <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>{attendee.name}</td>
                    <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>{attendee.email}</td>
                    <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>{attendee.department || 'N/A'}</td>
                    <td style={{ padding: '10px', borderBottom: '1px solid #ddd', textAlign: 'center' }}>
                      <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                        <input 
                          type="checkbox" 
                          checked={attendee.present}
                          onChange={(e) => handleAttendanceChange(attendee._id, e.target.checked)}
                          style={{ marginRight: '5px', width: '18px', height: '18px' }}
                        />
                        <span>Present</span>
                      </label>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between' }}>
              <button
                onClick={onClose}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#f44336',
                  color: '#1a237e',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitAttendance}
                disabled={submitting || success}
                style={{
                  padding: '10px 20px',
                  backgroundColor: submitting || success ? '#cccccc' : 'linear-gradient(90deg, #512da8 0%, #ffd700 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: submitting || success ? 'not-allowed' : 'pointer',
                }}
              >
                {submitting ? 'Submitting...' : success ? 'Submitted ✓' : 'Submit Attendance & Send Certificates'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default AttendanceModal;

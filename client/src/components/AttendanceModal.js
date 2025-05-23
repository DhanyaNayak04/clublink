import React, { useState, useEffect } from 'react';
import api from '../api';

function AttendanceModal({ eventId, onClose, generateCertificates = false }) {
  const [attendees, setAttendees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [attendanceSaved, setAttendanceSaved] = useState(false);

  useEffect(() => {
    const fetchAttendees = async () => {
      try {
        setLoading(true);
        console.log(`Fetching attendees for event: ${eventId}`);
        
        // First try to fetch existing attendance data
        const attendanceResponse = await api.get(`/api/attendance/event/${eventId}/attendees`, {
          headers: { 
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        console.log('Attendees data:', attendanceResponse.data);
        setAttendees(attendanceResponse.data);
        setError('');
      } catch (err) {
        console.error('Error fetching attendees:', err);
        try {
          // If no attendance data yet, fetch registrations
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
          
          console.log('Registration data:', formattedAttendees);
          setAttendees(formattedAttendees);
          setError('');
        } catch (regErr) {
          console.error('Error fetching registrations:', regErr);
          const errorMsg = regErr.response?.data?.message || 'Failed to load attendees list';
          setError(`${errorMsg} (${regErr.message})`);
          setAttendees([]);
        }
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
      
      console.log(`Marking attendance for student ${userId} in event ${eventId} as ${isPresent ? 'present' : 'absent'}`);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      // Call the attendance API endpoint
      await api.post(`/api/attendance/event/${eventId}/student/${userId}`, {
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

  const handleSaveAttendance = async () => {
    try {
      setSubmitting(true);
      setError('');
      
      // Create a payload with the attendance data
      const attendanceData = {
        attendees: attendees.map(a => ({
          userId: a._id,
          present: a.present === true
        }))
      };

      console.log('Saving attendance data without generating certificates:', attendanceData);

      // Only save attendance, don't finalize or generate certificates
      await Promise.all(attendees.map(async (attendee) => {
        if (attendee.present !== undefined) {
          await api.post(`/api/attendance/event/${eventId}/student/${attendee._id}`, {
            present: attendee.present
          }, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });
        }
      }));
      
      setAttendanceSaved(true);
      setSuccess('Attendance saved successfully. You can close this window or continue marking attendance.');
      
    } catch (err) {
      console.error('Error saving attendance:', err);
      setError(err.response?.data?.message || 'Failed to save attendance');
    } finally {
      setSubmitting(false);
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

      console.log('Submitting final attendance data with certificate generation:', attendanceData);

      // Submit final attendance and generate certificates
      const response = await api.post(`/api/attendance/submit/${eventId}`, attendanceData, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      console.log('Attendance submission response:', response.data);
      setSuccess(`Attendance submitted successfully! ${response.data.certificatesGenerated || 0} certificates will be generated and sent via email.`);
      
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
          <h2 style={{ margin: 0 }}>
            {generateCertificates ? 'Generate Certificates' : 'Take Attendance'}
          </h2>
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
              {generateCertificates 
                ? 'Finalize attendance and generate certificates. Certificates will be sent to students marked as present.' 
                : 'Mark attendance for each student. You can save progress and come back later.'}
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
                  backgroundColor: '#f5f5f5',
                  color: '#333',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
              
              <div style={{ display: 'flex', gap: '10px' }}>
                {!generateCertificates && (
                  <button
                    onClick={handleSaveAttendance}
                    disabled={submitting}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: submitting ? '#cccccc' : '#2196F3',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: submitting ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {submitting ? 'Saving...' : attendanceSaved ? 'Save Again' : 'Save Attendance'}
                  </button>
                )}
                
                {generateCertificates && (
                  <button
                    onClick={handleSubmitAttendance}
                    disabled={submitting || success}
                    style={{
                      padding: '10px 20px',
                      background: submitting || success ? '#cccccc' : '#4CAF50',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: submitting || success ? 'not-allowed' : 'pointer',
                      fontWeight: 'bold',
                    }}
                  >
                    {submitting ? 'Submitting...' : success ? 'Submitted ✓' : 'Submit & Generate Certificates'}
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default AttendanceModal;

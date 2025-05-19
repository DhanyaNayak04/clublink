const Event = require('../models/Event');
const User = require('../models/User');
const mongoose = require('mongoose');
const { sendMail } = require('../utils/mailer');

// Get attendees for an event
exports.getEventAttendees = async (req, res) => {
  try {
    const { eventId } = req.params;
    console.log(`Getting attendees for event ${eventId}, requested by user:`, req.user._id, req.user.role);

    // Validate eventId
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({ message: 'Invalid event ID' });
    }

    // Get the event with populated participants
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    // FIXED: Relax authorization check - allow any coordinator to view attendees
    // The original code was checking if the coordinator created the event
    if (req.user.role !== 'admin' && req.user.role !== 'coordinator') {
      return res.status(403).json({ message: 'Not authorized to view attendees' });
    }
    
    // Fetch participants with details
    const attendees = await User.find({ 
      _id: { $in: event.participants } 
    }).select('_id name email department');
    
    // Format for response
    const formattedAttendees = attendees.map(student => ({
      _id: student._id,
      name: student.name,
      email: student.email,
      department: student.department || 'N/A',
      present: false // Default to not present
    }));
    
    res.json(formattedAttendees);
  } catch (error) {
    console.error('Error fetching attendees:', error);
    res.status(500).json({ message: 'Error fetching attendees' });
  }
};

// Mark attendance for a student
exports.markAttendance = async (req, res) => {
  try {
    const { eventId, studentId } = req.params;
    const { present } = req.body;
    
    // Validate input
    if (present === undefined) {
      return res.status(400).json({ message: 'Attendance status (present) is required' });
    }
    
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    // CRITICAL FIX: Allow any coordinator to mark attendance
    // This is less restrictive than the current check
    if (req.user.role !== 'admin' && req.user.role !== 'coordinator') {
      return res.status(403).json({ message: 'Not authorized to mark attendance' });
    }
    
    // Check if student is registered (fix - use toString() for proper comparison)
    const studentRegistered = event.registrations.some(
      reg => reg.userId && reg.userId.toString() === studentId
    );
    
    if (!studentRegistered) {
      return res.status(404).json({ message: 'Student not registered for this event' });
    }
    
    // Update the attendance status
    const registrationIndex = event.registrations.findIndex(
      reg => reg.userId && reg.userId.toString() === studentId
    );
    
    if (registrationIndex === -1) {
      return res.status(404).json({ message: 'Student registration not found' });
    }
    
    // Set attendance status
    event.registrations[registrationIndex].attended = present;
    
    await event.save();
    res.json({ message: 'Attendance marked successfully' });
  } catch (error) {
    console.error('Error marking attendance:', error);
    res.status(500).json({ message: 'Error marking attendance' });
  }
};

// Submit attendance for an event
exports.submitAttendance = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { attendees } = req.body;
    
    if (!attendees || !Array.isArray(attendees)) {
      return res.status(400).json({ message: 'Invalid attendees data' });
    }
    
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    // FIX: Relax authorization check to allow ANY coordinator to submit attendance
    if (req.user.role !== 'admin' && req.user.role !== 'coordinator') {
      return res.status(403).json({ message: 'Not authorized to submit attendance' });
    }
    
    // Update attendance for all students
    for (const attendee of attendees) {
      const { userId, present } = attendee;
      
      const registrationIndex = event.registrations.findIndex(
        reg => reg.userId.toString() === userId
      );
      
      if (registrationIndex !== -1) {
        event.registrations[registrationIndex].attended = present;
      }
    }
    
    // Mark attendance as completed
    event.attendanceCompleted = true;
    
    await event.save();
    
    res.json({ 
      message: 'Attendance submitted successfully',
      certificatesGenerated: attendees.filter(a => a.present).length
    });
  } catch (error) {
    console.error('Error submitting attendance:', error);
    res.status(500).json({ message: 'Error submitting attendance' });
  }
};

module.exports = exports;

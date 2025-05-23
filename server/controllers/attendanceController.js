const Event = require('../models/Event');
const User = require('../models/User');
const mongoose = require('mongoose');
const { sendMail } = require('../utils/mailer');
const Certificate = require('../models/Certificate');

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
    
    // Allow any coordinator to view attendees
    if (req.user.role !== 'admin' && req.user.role !== 'coordinator') {
      return res.status(403).json({ message: 'Not authorized to view attendees' });
    }
    
    // Fetch participants with details
    const attendees = await User.find({ 
      _id: { $in: event.participants } 
    }).select('_id name email department');
    
    // Format for response - include attendance status if available
    const formattedAttendees = attendees.map(student => {
      const registration = event.registrations?.find(
        reg => reg.userId && reg.userId.toString() === student._id.toString()
      );
      
      return {
        _id: student._id,
        name: student.name,
        email: student.email,
        department: student.department || 'N/A',
        present: registration?.attended || false // Use existing attendance data if available
      };
    });
    
    res.json(formattedAttendees);
  } catch (error) {
    console.error('Error fetching attendees:', error);
    res.status(500).json({ message: 'Error fetching attendees' });
  }
};

// Mark attendance for a student without finalizing
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
    
    // Allow any coordinator to mark attendance
    if (req.user.role !== 'admin' && req.user.role !== 'coordinator') {
      return res.status(403).json({ message: 'Not authorized to mark attendance' });
    }
    
    // If attendance is already completed, don't allow changes
    if (event.attendanceCompleted) {
      return res.status(400).json({ message: 'Attendance is already finalized for this event' });
    }
    
    // Check if student is registered
    const isStudentRegistered = event.participants.some(id => id.toString() === studentId);
    if (!isStudentRegistered) {
      return res.status(404).json({ message: 'Student not registered for this event' });
    }
    
    // Update or create registration record
    if (!event.registrations) event.registrations = [];
    
    const registrationIndex = event.registrations.findIndex(
      reg => reg.userId && reg.userId.toString() === studentId
    );
    
    if (registrationIndex === -1) {
      // Create new registration record
      event.registrations.push({
        userId: studentId,
        attended: present
      });
    } else {
      // Update existing record
      event.registrations[registrationIndex].attended = present;
    }
    
    await event.save();
    res.json({ message: 'Attendance marked successfully' });
  } catch (error) {
    console.error('Error marking attendance:', error);
    res.status(500).json({ message: 'Error marking attendance' });
  }
};

// Submit attendance for an event and generate certificates
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
    
    // Allow any coordinator to submit attendance
    if (req.user.role !== 'admin' && req.user.role !== 'coordinator') {
      return res.status(403).json({ message: 'Not authorized to submit attendance' });
    }
    
    // Check if attendance is already completed
    if (event.attendanceCompleted) {
      return res.status(400).json({ message: 'Attendance has already been submitted for this event' });
    }
    
    // Update attendance for all students
    for (const attendee of attendees) {
      const { userId, present } = attendee;
      
      const registrationIndex = event.registrations.findIndex(
        reg => reg.userId && reg.userId.toString() === userId
      );
      
      if (registrationIndex !== -1) {
        event.registrations[registrationIndex].attended = present;
      } else if (present) {
        // If student is present but no registration exists, create one
        event.registrations.push({
          userId: userId,
          attended: true
        });
      }
    }
    
    // Generate certificates for students marked as present
    let certificatesGenerated = 0;
    let clubName = '';
    
    // Get club name for certificate
    if (event.club) {
      try {
        const club = await mongoose.model('Club').findById(event.club);
        clubName = club ? club.name : '';
      } catch (err) {
        console.error('Error getting club name:', err);
      }
    }
    
    // Find all students marked as present
    const presentStudents = event.registrations.filter(reg => reg.attended);
    
    // Generate certificates for present students
    for (const registration of presentStudents) {
      try {
        const certificateId = `CERT-${event._id.toString().slice(-6)}-${registration.userId.toString().slice(-6)}`;
        
        // Check if certificate already exists
        let certificate = await Certificate.findOne({ 
          event: eventId, 
          student: registration.userId 
        });
        
        if (!certificate) {
          // Create new certificate
          certificate = new Certificate({
            event: eventId,
            student: registration.userId,
            certificateId,
            issuedDate: new Date(),
            emailSent: false
          });
          await certificate.save();
          certificatesGenerated++;
          
          // Send email notification
          const student = await User.findById(registration.userId);
          if (student && student.email) {
            try {
              const subject = `Certificate for ${event.title}`;
              const text = `Dear ${student.name},

Congratulations on your participation in "${event.title}" organized by ${clubName || 'our club'}.

Your certificate has been generated and is available in your student dashboard.
Certificate ID: ${certificateId}

Best regards,
Club Management System`;

              await sendMail(student.email, subject, text);
              certificate.emailSent = true;
              await certificate.save();
            } catch (emailErr) {
              console.error('Error sending certificate email:', emailErr);
            }
          }
        }
      } catch (certErr) {
        console.error('Error generating certificate:', certErr);
      }
    }
    
    // Mark attendance as completed
    event.attendanceCompleted = true;
    await event.save();
    
    res.json({ 
      message: 'Attendance submitted and certificates generated successfully',
      certificatesGenerated 
    });
  } catch (error) {
    console.error('Error submitting attendance:', error);
    res.status(500).json({ message: 'Error submitting attendance' });
  }
};

module.exports = exports;

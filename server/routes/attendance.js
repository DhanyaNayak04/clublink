const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const auth = require('../middleware/auth');

// Get attendees for an event - ensure this is correctly registered
router.get('/event/:eventId/attendees', auth, attendanceController.getEventAttendees);

// Mark attendance for a student - ensure admin OR coordinator can access
router.post('/event/:eventId/student/:studentId', auth, attendanceController.markAttendance);

// Submit attendance for an event
router.post('/submit/:eventId', auth, attendanceController.submitAttendance);

module.exports = router;

const express = require('express');
const app = express();
const attendanceController = require('../controllers/attendanceController');
const auth = require('../middleware/auth');
const usersRouter = require('./routes/users');

app.use('/uploads', express.static('uploads'));
app.use('/api/users', usersRouter);

// Get attendees for an event - ensure this is correctly registered
router.get('/event/:eventId/attendees', auth, attendanceController.getEventAttendees);

// Mark attendance for a student
router.post('/event/:eventId/student/:studentId', auth, attendanceController.markAttendance);

// Submit attendance for an event
router.post('/submit/:eventId', auth, attendanceController.submitAttendance);

module.exports = router;
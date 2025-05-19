const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const auth = require('../middleware/auth');

console.log('Events router loaded');

// Public routes
router.get('/notifications', eventController.getNotifications);
router.get('/club/:clubId', eventController.getEventsByClub);

// Protected routes
router.use(auth);

// Event registration routes - ensure these are properly defined
router.post('/:eventId/register', eventController.registerForEvent);
router.get('/:eventId/registration-status', eventController.getRegistrationStatus);
router.get('/:eventId/attendees', eventController.getEventAttendees);
router.get('/:eventId/registrations', eventController.getEventRegistrations);

// Event management routes
router.post('/', eventController.createEvent);
router.get('/my', eventController.getMyEvents);
router.post('/request-venue', eventController.requestVenue);
router.get('/venue-requests', eventController.getMyVenueRequests);

// Add these new routes for attendance
router.post('/:eventId/mark-attendance', auth, eventController.markAttendance);
router.post('/:eventId/submit-attendance', auth, eventController.submitAttendance);

module.exports = router;

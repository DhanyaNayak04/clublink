const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');
const roles = require('../middleware/roles');

// Fix: Apply auth middleware before roles middleware
router.get('/coordinator-requests', auth, roles('admin'), userController.getCoordinatorRequests);
router.post('/approve-coordinator/:userId', auth, roles('admin'), userController.approveCoordinator);
router.post('/reject-coordinator/:userId', auth, roles('admin'), userController.rejectCoordinator);
router.get('/me', auth, userController.getMe);
router.get('/certificates', auth, userController.getCertificates);

// Add the missing endpoint for participated events
router.get('/my-events', auth, userController.getMyEvents);

module.exports = router;

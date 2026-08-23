const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const { authenticate, optionalAuthenticate } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

router.get('/', eventController.getEvents);
router.get('/:id', eventController.getEventById);
router.get('/:id/seats', optionalAuthenticate, eventController.getEventSeats);
router.post('/', authenticate, authorizeRoles('ORGANISER', 'ADMIN'), eventController.createEvent);
router.put('/:id', authenticate, authorizeRoles('ORGANISER', 'ADMIN'), eventController.updateEvent);
router.delete('/:id', authenticate, authorizeRoles('ORGANISER', 'ADMIN'), eventController.deleteEvent);

module.exports = router;

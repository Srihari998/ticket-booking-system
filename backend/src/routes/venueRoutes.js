const express = require('express');
const router = express.Router();
const venueController = require('../controllers/venueController');
const { authenticate } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

router.get('/', venueController.getVenues);
router.get('/categories', venueController.getSeatCategories);
router.get('/:id', venueController.getVenueById);
router.post('/', authenticate, authorizeRoles('ADMIN'), venueController.createVenue);
router.put('/:id', authenticate, authorizeRoles('ADMIN'), venueController.updateVenue);
router.delete('/:id', authenticate, authorizeRoles('ADMIN'), venueController.deleteVenue);

router.get('/:venueId/seats', venueController.getVenueSeats);
router.post('/:venueId/seats', authenticate, authorizeRoles('ADMIN'), venueController.createVenueSeats);

module.exports = router;

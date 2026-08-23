const express = require('express');
const router = express.Router();
const waitlistController = require('../controllers/waitlistController');
const { authenticate } = require('../middleware/authMiddleware');

router.post('/events/:eventId/waitlist', authenticate, waitlistController.joinWaitlist);
router.get('/events/:eventId/waitlist', waitlistController.getEventWaitlistStats);
router.get('/waitlist', authenticate, waitlistController.getUserWaitlists);
router.delete('/waitlist/:id', authenticate, waitlistController.cancelWaitlist);

router.get('/waitlist-offers/:token', waitlistController.getOfferByToken);
router.post('/waitlist-offers/:token/accept', authenticate, waitlistController.acceptOffer);

module.exports = router;

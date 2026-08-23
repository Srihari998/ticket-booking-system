const express = require('express');
const router = express.Router();
const organiserController = require('../controllers/organiserController');
const { authenticate } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

router.get('/events', authenticate, authorizeRoles('ORGANISER', 'ADMIN'), organiserController.getOrganiserEvents);
router.get('/events/:eventId/summary', authenticate, authorizeRoles('ORGANISER', 'ADMIN'), organiserController.getEventSummary);

module.exports = router;

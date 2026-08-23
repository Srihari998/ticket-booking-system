const express = require('express');
const router = express.Router();
const holdController = require('../controllers/holdController');
const { authenticate } = require('../middleware/authMiddleware');

router.post('/events/:eventId/holds', authenticate, holdController.createHold);
router.delete('/events/:eventId/holds', authenticate, holdController.releaseHold);

module.exports = router;

const express = require('express');
const authMiddleware = require('../middlewares/auth.middleware');
const userControllers = require('../controllers/user.controller');
const asyncHandler = require('../middlewares/asyncHandler')

const router = express.Router();

router.get('/me', asyncHandler(authMiddleware.authenticate) , asyncHandler(userControllers.getMe));

module.exports = router;
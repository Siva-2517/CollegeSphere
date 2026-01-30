const express = require('express')
const router = express.Router()

const { protect } = require('../middleware/auth.middleware')

const { register, login } = require('../controllers/auth.controllers')
router.post('/register', register)
router.post('/login', login)

module.exports = router;

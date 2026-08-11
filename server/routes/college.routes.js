const express = require('express');
const router = express.Router();

const {createCollege,getColleges}=require('../controllers/college.controllers');
const {protect}= require('../middleware/auth.middleware');

router.post('/create', protect(["superadmin"]), createCollege);

router.get('/all', getColleges);

module.exports = router;
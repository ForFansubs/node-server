const express = require('express')
const router = express.Router()
const jwt = require('jsonwebtoken');
const keys = require('../../config/keys');
const mariadb = require('../../config/maria')

// @route   GET api/logs
// @desc    View logs
// @access  Private
router.get('/bildirim-ekle', (req, res) => {

})

module.exports = router;
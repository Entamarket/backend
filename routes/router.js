const express = require('express')
const res = require('..')
const router = express.Router()

const traderControllers = require('../controllers/traderControllers')



router.post('/trader/signup', traderControllers.signup)
router.put('/trader/signup/account-verification', traderControllers.verifyOtp)


module.exports = router

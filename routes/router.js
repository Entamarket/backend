const express = require('express')
const router = express.Router()

const traderControllers = require('../controllers/traderControllers')
const {isJwtValid} = require('../lib/middleware')



router.post('/trader/signup', traderControllers.signup)
router.put('/trader/signup/account-verification', isJwtValid, traderControllers.verifyOtp)


module.exports = router

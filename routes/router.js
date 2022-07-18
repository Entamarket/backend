const express = require('express')
const router = express.Router()

const traderController = require('../controllers/traderController')
const {isJwtValid} = require('../lib/middleware')



router.post('/trader/signup', traderController.signup)
router.put('/trader/signup/account-verification', isJwtValid, traderController.verifyOtp)
router.get('/trader/signup/resend-otp', isJwtValid, traderController.resendOtp)
router.get('/trader/dashboard', isJwtValid, traderController.dashboard)
router.put('/trader/login', traderController.login)


module.exports = router

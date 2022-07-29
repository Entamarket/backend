const express = require('express')
const router = express.Router()

const traderControllerAuth = require('../controllers/traderController/traderControllerAuth')
const traderControllerDashboard = require('../controllers/traderController/traderControllerDashboard')
const shopController = require('../controllers/shopController/shopController')
const {isJwtValid, decodeToken, isTokenIdValid, isJSON} = require('../lib/middleware')



router.post('/trader/signup', traderControllerAuth.signup)
router.put('/trader/signup/account-verification', isJwtValid, traderControllerAuth.verifyOtp)
router.get('/trader/signup/resend-otp', isJwtValid, traderControllerAuth.resendOtp)
router.put('/trader/login', traderControllerAuth.login)
router.get('/trader/dashboard', isJwtValid, traderControllerDashboard.home)

router.post('/shop/create-shop', isJwtValid, decodeToken, isTokenIdValid, isJSON, shopController.createShop)


module.exports = router

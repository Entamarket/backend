const express = require('express')
const router = express.Router()

const traderController = require('../controllers/traderController')
const {isJwtValid} = require('../lib/middleware')



router.post('/trader/signup', traderController.signup)
router.put('/trader/signup/account-verification', isJwtValid, traderController.verifyOtp)


module.exports = router

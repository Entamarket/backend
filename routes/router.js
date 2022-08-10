const express = require('express')
const router = express.Router()

const traderControllerAuth = require('../controllers/traderController/traderControllerAuth')
const traderControllerDashboard = require('../controllers/traderController/traderControllerDashboard')
const shopController = require('../controllers/shopController/shopController')
const productController = require('../controllers/productController/productController')
const {isJwtValid, decodeToken, isTokenIdValid, isJSON} = require('../lib/middleware')


router.post('/trader/signup', isJSON, traderControllerAuth.signup)
router.put('/trader/signup/account-verification', isJwtValid, decodeToken, isTokenIdValid, isJSON, traderControllerAuth.verifyOtp)
router.get('/trader/signup/resend-otp', isJwtValid, decodeToken, isTokenIdValid, traderControllerAuth.resendOtp)
router.put('/trader/login', isJSON, traderControllerAuth.login)
router.get('/trader/dashboard', isJwtValid, decodeToken, isTokenIdValid, traderControllerDashboard.home)
router.delete('/trader/dashboard/delete-account', isJwtValid, decodeToken, isTokenIdValid, traderControllerDashboard.deleteAccount)


router.post('/shop/create-shop', isJwtValid, decodeToken, isTokenIdValid, isJSON, shopController.createShop)
router.put('/shop/update-shop', isJwtValid, decodeToken, isTokenIdValid, isJSON, shopController.updateShop)
router.delete('/shop/delete-shop', isJwtValid, decodeToken, isTokenIdValid, shopController.deleteShop)

router.post('/shop/add-product', isJwtValid, decodeToken, isTokenIdValid, isJSON, productController.addProduct)

module.exports = router

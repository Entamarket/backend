const express = require('express')
const router = express.Router()

const traderControllerAuth = require('../controllers/traderController/traderControllerAuth')
const traderControllerDashboard = require('../controllers/traderController/traderControllerDashboard')
const shopController = require('../controllers/shopController/shopController')
const productController = require('../controllers/productController/productController')
const {bodyParser, isJwtValid, decodeToken, isTokenIdValid, isJSON, uploads, multimedia} = require('../lib/middleware')


router.use('/multimedia/traders', multimedia)

router.post('/trader/signup', bodyParser, isJSON, traderControllerAuth.signup)
router.put('/trader/signup/account-verification', bodyParser, isJwtValid, decodeToken, isTokenIdValid, isJSON, traderControllerAuth.verifyOtp)
router.get('/trader/signup/resend-otp', isJwtValid, decodeToken, isTokenIdValid, traderControllerAuth.resendOtp)
router.put('/trader/login', bodyParser, isJSON, traderControllerAuth.login)
router.get('/trader/dashboard', isJwtValid, decodeToken, isTokenIdValid, traderControllerDashboard.home)
router.delete('/trader/dashboard/delete-account', isJwtValid, decodeToken, isTokenIdValid, traderControllerDashboard.deleteAccount)


router.post('/shop/create-shop', bodyParser, isJwtValid, decodeToken, isTokenIdValid, isJSON, shopController.createShop)
router.put('/shop/update-shop', bodyParser, isJwtValid, decodeToken, isTokenIdValid, isJSON, shopController.updateShop)
router.delete('/shop/delete-shop', isJwtValid, decodeToken, isTokenIdValid, shopController.deleteShop)


router.post('/product/add-product', isJwtValid, decodeToken, isTokenIdValid, uploads, productController.addProduct)


module.exports = router

const express = require('express')
const router = express.Router()

const traderControllerAuth = require('../controllers/traderController/traderControllerAuth')
const traderControllerDashboard = require('../controllers/traderController/traderControllerDashboard')
const shopController = require('../controllers/shopController/shopController')
const productController = require('../controllers/productController/productController')
const buyerControllerAuth = require('../controllers/buyerController/buyerControllerAuth')
const buyerControllerDashboard = require('../controllers/buyerController/buyerControllerDashboard')
const appController = require('../controllers/appController/appController')
const commentController = require('../controllers/commentController/commentController')
const reactionController = require('../controllers/reactionController/reactionController')
const homePageController = require('../controllers/homePageController/homePageController')
const {bodyParser, isJwtValid, decodeToken, isTokenIdValid, isJSON, uploads, multimedia, updateUploads, isTrader} = require('../lib/middleware')


router.use('/multimedia/traders', multimedia)

router.post('/trader/signup', bodyParser, isJSON, traderControllerAuth.signup)
router.put('/trader/signup/account-verification', bodyParser, isJwtValid, decodeToken, isTokenIdValid, isJSON, traderControllerAuth.verifyOtp)
router.get('/trader/signup/resend-otp', isJwtValid, decodeToken, isTokenIdValid, traderControllerAuth.resendOtp)
router.put('/trader/login', bodyParser, isJSON, traderControllerAuth.login)
router.get('/trader/dashboard', isJwtValid, decodeToken, isTokenIdValid, traderControllerDashboard.home)
router.delete('/trader/dashboard/delete-account', isJwtValid, decodeToken, isTokenIdValid, traderControllerDashboard.deleteAccount)
router.put('/trader/dashboard/update-profile', bodyParser, isJwtValid, decodeToken, isTokenIdValid, isJSON, traderControllerDashboard.updateProfile)
router.put('/trader/dashboard/update-email', bodyParser, isJwtValid, decodeToken, isTokenIdValid, isJSON, traderControllerDashboard.updateEmail)
router.put('/trader/dashboard/verify-update-otp', bodyParser, isJwtValid, decodeToken, isTokenIdValid, isJSON, traderControllerDashboard.verifyUpdateOtp)
router.put('/trader/dashboard/update-password', bodyParser, isJwtValid, decodeToken, isTokenIdValid, isJSON, traderControllerDashboard.updatePassword)
router.delete('/pending-trader/delete', isJwtValid, decodeToken, isTokenIdValid, traderControllerAuth.deletePendingTraderAccount)
router.put('/trader/get-new-password', bodyParser, isJSON, traderControllerAuth.getNewPassword)


router.post('/buyer/signup', bodyParser, isJSON, buyerControllerAuth.signup)
router.put('/buyer/signup/account-verification', bodyParser, isJwtValid, decodeToken, isTokenIdValid, isJSON, buyerControllerAuth.verifyOtp)
router.get('/buyer/signup/resend-otp', isJwtValid, decodeToken, isTokenIdValid, buyerControllerAuth.resendOtp)
router.put('/buyer/login', bodyParser, isJSON, buyerControllerAuth.login)
router.put('/buyer/get-new-password', bodyParser, isJSON, buyerControllerAuth.getNewPassword)
router.get('/buyer/dashboard', isJwtValid, decodeToken, isTokenIdValid, buyerControllerDashboard.home)
router.put('/buyer/dashboard/update-profile', bodyParser, isJwtValid, decodeToken, isTokenIdValid, isJSON, buyerControllerDashboard.updateProfile)
router.put('/buyer/dashboard/update-email', bodyParser, isJwtValid, decodeToken, isTokenIdValid, isJSON, buyerControllerDashboard.updateEmail)
router.put('/buyer/dashboard/update-password', bodyParser, isJwtValid, decodeToken, isTokenIdValid, isJSON, buyerControllerDashboard.updatePassword)
router.put('/buyer/dashboard/verify-update-otp', bodyParser, isJwtValid, decodeToken, isTokenIdValid, isJSON, buyerControllerDashboard.verifyUpdateOtp)
router.delete('/buyer/dashboard/delete-account', isJwtValid, decodeToken, isTokenIdValid, buyerControllerDashboard.deleteAccount)

router.post('/shop/create-shop', bodyParser, isJwtValid, decodeToken, isTokenIdValid, isJSON, isTrader, shopController.createShop)
router.put('/shop/update-shop', bodyParser, isJwtValid, decodeToken, isTokenIdValid, isJSON, shopController.updateShop)
router.delete('/shop/delete-shop', isJwtValid, decodeToken, isTokenIdValid, shopController.deleteShop)
router.get('/shop/get-shop', isJwtValid, decodeToken, isTokenIdValid, shopController.getShop)
router.put('/shop/add-to-favourite-shops', bodyParser, isJwtValid, decodeToken, isTokenIdValid, shopController.addToFavouriteShops)
router.delete('/shop/remove-from-favourite-shops', isJwtValid, decodeToken, isTokenIdValid, shopController.removeFromFavouriteShops)


router.post('/product/add-product', isJwtValid, decodeToken, isTokenIdValid, uploads, productController.addProduct)
router.put('/product/update-product', isJwtValid, decodeToken, isTokenIdValid, updateUploads, productController.updateProduct)
router.delete('/product/delete-product', isJwtValid, decodeToken, isTokenIdValid, productController.deleteProduct)


router.post('/comment/add-comment', bodyParser, isJwtValid, decodeToken, isTokenIdValid, uploads, commentController.addComment)
router.put('/comment/update-comment', bodyParser, isJwtValid, decodeToken, isTokenIdValid, uploads, commentController.updateComment)
router.delete('/comment/delete-comment', bodyParser, isJwtValid, decodeToken, isTokenIdValid, uploads, commentController.deleteComment)


router.post('/reaction/add-reaction', bodyParser, isJwtValid, decodeToken, isTokenIdValid, uploads, reactionController.addReaction)
router.put('/reaction/update-reaction', bodyParser, isJwtValid, decodeToken, isTokenIdValid, uploads, reactionController.updateReaction)
router.delete('/reaction/delete-reaction', bodyParser, isJwtValid, decodeToken, isTokenIdValid, uploads, reactionController.deleteReaction)


router.get('/home-page', homePageController.home)

router.get('/search', appController.search)

module.exports = router

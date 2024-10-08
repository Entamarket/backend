const express = require('express')
const router = express.Router()
require('dotenv').config()

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
//const cartController = require('../controllers/cartController/cartController')
const notificationController = require("../controllers/notificationController/notificationController")
const userController = require("../controllers/userController/userController")
const checkoutController = require("../controllers/checkoutController/checkoutController")
const purchaseCalculatorController = require("../controllers/purchaseCalculatorController/purchaseCalculatorController")
const deliveryController = require("../controllers/deliveryController/deliveryController") 
const adminController = require("../controllers/adminController/adminController")
const adminAuth = require("../controllers/adminController/adminAuth")
const logisticsController = require("../controllers/logisticsController/logisticsController")
const logisticsAuth = require("../controllers/logisticsController/logisticsAuth")
const customerSupportController = require("../controllers/customerSuportController/customerSuportController")
const emailSubscriptionController = require("../controllers/emailSubscriptionController/emailSubscriptionController")
const soldProductsController = require("../controllers/soldProductsController/soldProductsController")
const requestDeleteAccount = require("../controllers/requestDeleteController/requestDelete")

const {
    bodyParser, isJwtValid, isJwtValidNB, decodeToken, isTokenIdValid, isJSON, multimedia,
    isTrader, isAdmin, isLogistics, 
    getLogo, multipartFormParser
} = require('../lib/middleware')


router.use('/multimedia/traders', multimedia)
router.get('/logo', getLogo)

router.post('/trader/signup', bodyParser, isJSON, traderControllerAuth.signup)
router.put('/trader/signup/account-verification', bodyParser, isJwtValid, decodeToken, isTokenIdValid, isJSON, traderControllerAuth.verifyOtp)
router.get('/trader/signup/resend-otp', isJwtValid, decodeToken, isTokenIdValid, traderControllerAuth.resendOtp)
router.put('/trader/login', bodyParser, isJSON, traderControllerAuth.login)
router.get('/trader/dashboard', isJwtValidNB, decodeToken, isTokenIdValid, traderControllerDashboard.home)
router.delete('/trader/dashboard/delete-account', isJwtValid, decodeToken, isTokenIdValid, traderControllerDashboard.deleteAccount)
router.put('/trader/dashboard/update-profile', bodyParser, isJwtValid, decodeToken, isTokenIdValid, isJSON, traderControllerDashboard.updateProfile)
router.put('/trader/dashboard/update-email', bodyParser, isJwtValid, decodeToken, isTokenIdValid, isJSON, traderControllerDashboard.updateEmail)
router.put('/trader/dashboard/update-bank-details', bodyParser, isJwtValidNB, decodeToken, isTokenIdValid, traderControllerDashboard.updateBankDetails)
router.put('/trader/verify-update-otp', bodyParser, isJSON, traderControllerDashboard.verifyUpdateOtp)
router.put('/trader/dashboard/verify-update-otp', bodyParser, isJwtValid, decodeToken, isTokenIdValid, isJSON, traderControllerDashboard.verifyUpdateOtp)


router.put('/trader/dashboard/update-password', bodyParser, isJwtValid, decodeToken, isTokenIdValid, isJSON, traderControllerDashboard.updatePassword)
router.delete('/pending-trader/delete', isJwtValid, decodeToken, isTokenIdValid, traderControllerAuth.deletePendingTraderAccount)
router.put('/trader/get-new-password', bodyParser, isJSON, traderControllerAuth.getNewPassword)
router.get("/trader/dashboard/request-withdrawal", isJwtValidNB, decodeToken, isTokenIdValid, traderControllerDashboard.requestWithdrawal)
router.put("/trader/dashboard/confirm-bank-details", bodyParser, isJwtValidNB, decodeToken, isTokenIdValid, isJSON, traderControllerDashboard.confirmBankDetails)
router.get('/trader/get-sales-history', isJwtValidNB, decodeToken, isTokenIdValid, traderControllerDashboard.getSalesHistory)
router.put('/trader/get-account-name', bodyParser, isJSON, isJwtValidNB, decodeToken, isTokenIdValid, traderControllerDashboard.getAccountName)
router.post('/trader/upload-verification-docs', isJwtValidNB, decodeToken, isTokenIdValid, multipartFormParser, traderControllerDashboard.uploadVerificationDocs)


router.post('/buyer/signup', bodyParser, isJSON, buyerControllerAuth.signup)
router.put('/buyer/signup/account-verification', bodyParser, isJwtValid, decodeToken, isTokenIdValid, isJSON, buyerControllerAuth.verifyOtp)
router.get('/buyer/signup/resend-otp', isJwtValid, decodeToken, isTokenIdValid, buyerControllerAuth.resendOtp)
router.put('/buyer/login', bodyParser, isJSON, buyerControllerAuth.login)
router.put('/buyer/get-new-password', bodyParser, isJSON, buyerControllerAuth.getNewPassword)
router.get('/buyer/dashboard', isJwtValidNB, decodeToken, isTokenIdValid, buyerControllerDashboard.home)
router.put('/buyer/dashboard/update-profile', bodyParser, isJwtValid, decodeToken, isTokenIdValid, isJSON, buyerControllerDashboard.updateProfile)
router.put('/buyer/dashboard/update-email', bodyParser, isJwtValid, decodeToken, isTokenIdValid, isJSON, buyerControllerDashboard.updateEmail)
router.put('/buyer/dashboard/update-password', bodyParser, isJwtValid, decodeToken, isTokenIdValid, isJSON, buyerControllerDashboard.updatePassword)
router.put('/buyer/verify-update-otp', bodyParser, isJSON, buyerControllerDashboard.verifyUpdateOtp)
router.put('/buyer/dashboard/verify-update-otp', bodyParser, isJwtValid, decodeToken, isTokenIdValid, isJSON, buyerControllerDashboard.verifyUpdateOtp)
router.get('/buyer/get-purchase-history', isJwtValidNB, decodeToken, isTokenIdValid, buyerControllerDashboard.getPurchaseHistory)
router.delete('/buyer/dashboard/delete-account', isJwtValid, decodeToken, isTokenIdValid, buyerControllerDashboard.deleteAccount)
router.get('/buyer/get-receipt', isJwtValidNB, decodeToken, isTokenIdValid, buyerControllerDashboard.getReceipt)

router.get("/user/get-user", isJwtValidNB, decodeToken, isTokenIdValid, userController.getUser)

router.post('/shop/create-shop', bodyParser, isJwtValid, decodeToken, isTokenIdValid, isJSON, isTrader, shopController.createShop)
router.put('/shop/update-shop', bodyParser, isJwtValid, decodeToken, isTokenIdValid, isJSON, shopController.updateShop)
router.delete('/shop/delete-shop', isJwtValid, decodeToken, isTokenIdValid, shopController.deleteShop)
router.get('/shop/get-shop', isJwtValidNB, decodeToken, isTokenIdValid, shopController.getShop)
router.put('/shop/add-to-favourite-shops', bodyParser, isJwtValid, decodeToken, isTokenIdValid, shopController.addToFavouriteShops)
router.delete('/shop/remove-from-favourite-shops', isJwtValid, decodeToken, isTokenIdValid, shopController.removeFromFavouriteShops)
router.get('/shop/get-shop-unauth', shopController.getShopUnauth)
router.get("/shop/:id/:id", shopController.getShopProfile)

router.post('/product/add-product', isJwtValid, decodeToken, isTokenIdValid, multipartFormParser, productController.addProduct)
router.put('/product/update-product', isJwtValid, decodeToken, isTokenIdValid, multipartFormParser, productController.updateProduct)
router.delete('/product/delete-product', isJwtValid, decodeToken, isTokenIdValid, productController.deleteProduct)
router.get('/product/get-product', productController.getProduct)
router.get('/product/get-all-traders-products', isJwtValidNB, decodeToken, isTokenIdValid, productController.getAllTradersProducts)

router.post('/comment/add-comment', bodyParser, isJwtValid, decodeToken, isTokenIdValid, isJSON, commentController.addComment)
router.get('/comment/get-comments', commentController.getComments)
router.put('/comment/update-comment', bodyParser, isJwtValid, decodeToken, isTokenIdValid, isJSON, commentController.updateComment)
router.delete('/comment/delete-comment', isJwtValid, decodeToken, isTokenIdValid, commentController.deleteComment)

router.put('/reaction/update-reaction', bodyParser, isJwtValid, decodeToken, isTokenIdValid, isJSON, reactionController.updateReaction)
router.get('/reaction/get-reactions', reactionController.getReactions)

router.get('/home-page', homePageController.home)

// router.put('/cart/update-cart', bodyParser, isJwtValidNB, decodeToken, isTokenIdValid, isJSON, cartController.updateCart)
// router.get('/cart/get-cart', bodyParser, isJwtValidNB, decodeToken, isTokenIdValid, cartController.getCart)
// router.delete('/cart/delete-cart-item', isJwtValidNB, decodeToken, isTokenIdValid, cartController.deleteCart)

router.get('/search', appController.search)

router.get("/notification/get-more-notifications", isJwtValidNB, decodeToken, isTokenIdValid, notificationController.getMore)
router.get("/notification/get-product-via-notification", isJwtValidNB, decodeToken, isTokenIdValid, notificationController.getProductViaNotification)

router.put("/checkout/checkout", bodyParser, isJwtValidNB, decodeToken, isTokenIdValid, isJSON, checkoutController.checkout)
router.put("/purchase-calculator", bodyParser, isJwtValidNB, decodeToken, isTokenIdValid, isJSON, purchaseCalculatorController.calculatePurchase)

router.delete("/delivery/confirm-delivery", isJwtValidNB, decodeToken, isTokenIdValid, deliveryController.confirmDelivery)
router.get("/delivery/get-pending-deliveries", isJwtValidNB, decodeToken, isTokenIdValid, deliveryController.getPendingDeliveries)
router.get("/delivery/get-single-pending-delivery", isJwtValidNB, decodeToken, isTokenIdValid, deliveryController.getSinglependingDelivery)
router.get("/delivery/get-trader-pending-deliveries", isJwtValidNB, decodeToken, isTokenIdValid, deliveryController.getTraderPendingDeliveries)
router.get("/delivery/get-single-trader-pending-delivery", isJwtValidNB, decodeToken, isTokenIdValid, deliveryController.getSingleTraderPendingDelivery)

router.get("/sold-products/get-sold-products", isJwtValidNB, decodeToken, isTokenIdValid, soldProductsController.getSoldProducts)
router.get("/sold-products/get-single-sold-product", isJwtValidNB, decodeToken, isTokenIdValid, soldProductsController.getSingleSoldProduct)

//ADMIN API
router.get("/admin/get-single-pending-delivery", isJwtValidNB, decodeToken, isAdmin, adminController.getSinglependingDelivery)
router.get("/admin/get-pending-deliveries", isJwtValidNB, decodeToken, isAdmin, adminController.getPendingDeliveries)
router.get("/admin/get-counts", isJwtValidNB, decodeToken, isAdmin, adminController.getCounts)
router.put("/admin/login", bodyParser, isJSON, adminAuth.login)
router.put('/admin/update-password', bodyParser, isJwtValid, decodeToken, isAdmin, isJSON, adminAuth.updatePassword)
router.put('/admin/verify-update-otp', bodyParser, isJwtValid, decodeToken, isAdmin, isJSON, adminAuth.verifyUpdateOtp)
router.put('/admin/update-email', bodyParser, isJwtValid, decodeToken, isAdmin, isJSON, adminAuth.updateEmail)
router.put('/admin/update-username', bodyParser, isJwtValid, decodeToken, isAdmin, isJSON, adminAuth.updateUsername)
router.get("/admin/get-pending-withdrawals", isJwtValidNB, decodeToken, isAdmin, adminController.getPendingWithdrawals)
router.get("/admin/get-notifications", isJwtValidNB, decodeToken, isAdmin, adminController.getNotifications)
router.get("/admin/view-notification", isJwtValidNB, decodeToken, isAdmin, adminController.viewNotification)
router.delete("/admin/confirm-withdrawal", isJwtValidNB, decodeToken, isAdmin, adminController.confirmWithdrawal)
router.get("/admin/view-trader-verification-docs", isJwtValidNB, decodeToken, isAdmin, adminController.viewTraderVerificationDocs)
router.put("/admin/trader-verification-docs-verdict", bodyParser, isJwtValidNB, decodeToken, isAdmin, isJSON, adminController.TraderVerificationDocsVerdict)

//LOGISTICS API
router.get("/logistics/get-single-pending-delivery", isJwtValidNB, decodeToken, isLogistics, logisticsController.getSinglependingDelivery)
router.get("/logistics/get-pending-deliveries", isJwtValidNB, decodeToken, isLogistics, logisticsController.getPendingDeliveries)
router.get("/logistics/get-counts", isJwtValidNB, decodeToken, isLogistics, logisticsController.getCounts)
router.put("/logistics/login", bodyParser, isJSON, logisticsAuth.login)
router.put('/logistics/update-password', bodyParser, isJwtValid, decodeToken, isLogistics, isJSON, logisticsAuth.updatePassword)
router.put('/logistics/verify-update-otp', bodyParser, isJwtValid, decodeToken, isLogistics, isJSON, logisticsAuth.verifyUpdateOtp)
router.put('/logistics/update-email', bodyParser, isJwtValid, decodeToken, isLogistics, isJSON, logisticsAuth.updateEmail)
router.put('/logistics/update-username', bodyParser, isJwtValid, decodeToken, isLogistics, isJSON, logisticsAuth.updateUsername)
router.get("/logistics/get-notifications", isJwtValidNB, decodeToken, isLogistics, logisticsController.getNotifications)
router.get("/logistics/view-notification", isJwtValidNB, decodeToken, isLogistics, logisticsController.viewNotification)
router.get('/logistics/confirm-delivery', isJwtValidNB, decodeToken, isLogistics, logisticsController.confirmDelivery)
router.put('/logistics/confirm-product', bodyParser, isJwtValidNB, decodeToken, isLogistics, isJSON, logisticsController.confirmProduct)

router.post('/customer-support/send', bodyParser, isJwtValidNB, decodeToken, isJSON, customerSupportController.send)
router.get('/customer-support/get-all', isJwtValidNB, decodeToken, isAdmin, customerSupportController.getAll)
router.get('/customer-support/get-one', isJwtValidNB, decodeToken, isAdmin, customerSupportController.getOne)
router.delete('/customer-support/close', isJwtValidNB, decodeToken, isAdmin, customerSupportController.close)

router.delete("/email-subscription/unsubscribe", emailSubscriptionController.unsubscribe)
router.post("/email-subscription/subscribe", isJwtValidNB, decodeToken, isTokenIdValid, emailSubscriptionController.subscribe)


//DELETE PAGE
router.put("/request-account-delete", bodyParser, isJSON, requestDeleteAccount.deleteAccount)


module.exports = router
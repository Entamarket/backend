const express = require('express')

const traderControllers = require('../controllers/traderControllers')
const router = express.Router()


router.post('/trader/signup', traderControllers.post)


module.exports = router

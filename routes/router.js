const express = require('express')
const res = require('..')
const router = express.Router()

const traderControllers = require('../controllers/traderControllers')



router.post('/trader/signup', traderControllers.post)


module.exports = router

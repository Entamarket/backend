const variables = {
    islandPrice: 5000,
    mainLandPrice: 2500,
    paymentGatewayMaxThreshold: 126667,
    maxThresholdFee: 3000,
    paymentGatewayLv1Threshold: 2500,

    lv1ThresholdFee: (total)=> parseFloat(((3/100) * total).toFixed(2)) + 130,
    lv0ThresholdFee: (total)=> parseFloat(((3/100) * total).toFixed(2)) 

}

module.exports = variables
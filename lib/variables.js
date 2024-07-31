const variables = {
    islandPrice: 0,
    mainLandPrice: 0,
    paymentGatewayMaxThreshold: 126667,
    maxThresholdFee: 3000,
    paymentGatewayLv1Threshold: 2500,
    small: 960,
    medium: 1460,
    large: 1960,
    xlFactor: 110,
    ppkg: 500,

    lv1ThresholdFee: (total)=> Math.ceil(parseFloat(((3/100) * total))) + 130,
    lv0ThresholdFee: (total)=> Math.ceil(parseFloat(((3/100) * total))) 

}

module.exports = variables
const PDFDocument = require('pdfkit');
const path = require("path")
const pdfGenerator = (dataCallback, endCallback, content)=>{

  // Create a document 
  const doc = new PDFDocument({autoFirstPage: false});
  doc.registerFont("Roboto", __dirname + "/Roboto-Regular.ttf")


  const formatter = new Intl.NumberFormat('en-NG', {
    style: "currency",
    currency: "NGN"
  });

  doc.on('data', dataCallback);
  doc.on('end', endCallback); 
  doc.addPage({
    margins: {
      top: 10,
      bottom: 10,
      left: 10,
      right: 10
  }})
    

  // Adding functionality 
  doc.image(path.join(__dirname, "logo.jpg"), { 
    fit: [100, 100], 
    align: 'left', 
    valign: 'top',    
  }); 
    
    
  doc 
  .fontSize(18) 
  .text("\n\n" + `Purchase Reciept For ${content.buyerName}`, {align: "center", underline: true});
  doc.moveDown()
      

  doc.fontSize(12).text(`Date: ${content.date}`, 10, 150, { align: 'left', underline: true });
  doc.font("Roboto").fontSize(12).text(`CheckoutID: ${content.checkoutID}`, 10, 150, { align: 'right', underline: true});

  doc.moveDown()
  let productCount=1
  let x = 10, y= 200, inc = 20, yThreshold = 790; 

  //this loop lists out the products and their prices
  for(let product of content.products){
    
    if(y + 220 >= yThreshold){
      doc.addPage({
      margins: {
        top: 10,
        bottom: 10,
        left: 10,
        right: 10
      }})
      y = 10
    }
    
    doc.moveTo(x, y)
    .lineTo(doc.page.width, y)
    .stroke();
    y+=inc;

    doc.fontSize(14).text(`Product ${productCount}`, x, y, {align: "center", underline: true});
    y+=inc;
    doc.fontSize(14).text('Product name:', x, y, {align: "left"});
    doc.fontSize(14).text(product.productName, x, y, {align: "right"});
    y+=inc; 

    doc.fontSize(14).text('Product price:', x, y, {align: "left"});
    doc.fontSize(14).text(formatter.format(product.productPrice), x, y, {align: "right"});

    y+=inc; 

    doc.fontSize(14).text('Product quantity:', x, y, {align: "left"});
    doc.fontSize(14).text(product.quantity, x, y, {align: "right"});

    y+=inc; 

    doc.fontSize(14).text('Total product price:', x, y, {align: "left"});
    doc.fontSize(14).text(formatter.format(product.totalProductPrice), x, y, {align: "right"});

    y+=inc; 

    doc.fontSize(14).text('Shop name:', x, y, {align: "left"});
    doc.fontSize(14).text(product.shop.name, x, y, {align: "right"});

    y+=inc; 

    doc.fontSize(14).text('Shop address:', x, y, {align: "left"});
    doc.fontSize(14).text(product.shop.shopAddress, x, y, {align: "right"});

    y+=inc; 

    doc.fontSize(14).text('Trader name:', x, y, {align: "left"});
    doc.fontSize(14).text(`${product.trader.firstName} ${product.trader.lastName}`, x, y, {align: "right"});

    y+=inc; 

    doc.fontSize(14).text('Trader phone no:', x, y, {align: "left"});
    doc.fontSize(14).text(product.trader.phoneNumber, x, y, {align: "right"});

    y+=inc; 

    doc.moveTo(x, y)
    .lineTo(doc.page.width, y)
    .stroke();
    y+=inc;

      
    productCount++;

  }

  //  OTHER CHARGES
  
  if(y + 100 >= yThreshold){
    doc.addPage({
      margins: {
        top: 10,
        bottom: 10,
        left: 10,
        right: 10
    }})
    y = 10
  }
  doc.moveTo(x, y)
  .lineTo(doc.page.width, y)
  .stroke();
  y+=inc;

  doc.fontSize(14).text(`Other Charges`, x, y, {align: "center", underline: true});
  y+=inc;
  doc.fontSize(14).text('Logistics fee:', x, y, {align: "left"});
  doc.fontSize(14).text(formatter.format(content.logisticsFee), x, y, {align: "right"});
  y+=inc;
  doc.fontSize(14).text('Payment gateway fee:', x, y, {align: "left"});
  doc.fontSize(14).text(formatter.format(content.paymentGatewayFee), x, y, {align: "right"});

  y+=inc; 

  doc.moveTo(x, y)
  .lineTo(doc.page.width, y)
  .stroke();
  y+=inc;
  
  //TOTAL CHARGES
  if(y + 80 >= yThreshold){
    doc.addPage({
      margins: {
        top: 10,
        bottom: 10,
        left: 10,
        right: 10
    }})
    y = 10
  }
  doc.moveTo(x, y)
  .lineTo(doc.page.width, y)
  .stroke();

  y+=inc;
  
  doc.fontSize(14).text(`TOTAL:`, x, y, {align: "center", underline: true});
  y+=inc;

  doc.fontSize(14).text('TOTAL:', x, y, {align: "left"});
  doc.fontSize(14).text(formatter.format(content.total), x, y, {align: "right"});

  y+=inc;
  doc.moveTo(x, y)
  .lineTo(doc.page.width, y)
  .stroke();
      
  y+=inc;

  doc.moveDown()
  doc.moveDown()

//ADD LINK
  if(y >= yThreshold){
    doc.addPage({
      margins: {
        top: 10,
        bottom: 10,
        left: 10,
        right: 10
    }})
    y = 10
  }
  //ADD LINK
  doc.fillColor('blue')
  .text("Click here to see more ", {
    align: "center",
    link: 'https://www.entamarket.com',
    underline: true
  })
  

  // Finalize PDF file 
  doc.end();

}


module.exports = pdfGenerator;
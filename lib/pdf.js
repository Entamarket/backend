const PDFDocument = require('pdfkit');
const path = require("path")
const pdfGenerator = (dataCallback, endCallback, content)=>{

    // const receiptContent = `
    //     Product name: ${receiptData.productName}
    //     Product price: N${purchase.product.price}
    //     Quantity: ${purchase.quantity}
    //     Total product price: N${parseInt(purchase.product.price)* purchase.quantity}
    //     ShopAddress: ${shopData.shopAddress}
    //     TraderName: ${trader.firstName + " " + trader.lastName}
    //     TraderPhoneNumber: ${trader.phoneNumber}
    //     BuyerName: ${buyer.firstName + " " + buyer.lastName}
    //     BuyerPhoneNumber: ${buyer.phoneNumber}
    //     Date: ${purchase.soldAt}
    //   `

    // Create a document 
    const doc = new PDFDocument({autoFirstPage: false});

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
        valign: 'top'
    }); 
    
    
    doc 
    .fontSize(18) 
    .text("\n\n\n" + "Purchase Reciept", {align: "center", underline: true});
    doc.moveDown()

    doc.text(`Date `, {
        width: 410,
        align: 'justify'
      }
      );
      //(doc.x, 0, 410, doc.y).stroke();
      
      // draw bounding rectangle
      

    // Finalize PDF file 
    doc.end();

}


module.exports = pdfGenerator;
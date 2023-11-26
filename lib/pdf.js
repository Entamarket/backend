const PDFDocument = require('pdfkit');
const path = require("path")
const pdfGenerator = (dataCallback, endCallback, content)=>{

    // Create a document 
    const doc = new PDFDocument();

    doc.on('data', dataCallback);
    doc.on('end', endCallback); 
    

    // Adding functionality 
    doc.image(path.join(__dirname, "logo.jpg"), { 
        fit: [300, 300], 
        align: 'center', 
        valign: 'top'
    }); 
    
    
    doc 
    .fontSize(22) 
    .text("\n\n\n" + content, 100, 100);

    // Finalize PDF file 
    doc.end();

}


module.exports = pdfGenerator;
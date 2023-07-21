const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const PDFDocument = require('pdfkit');
const cors = require('cors');

const app = express();

app.use(cors());

// Set up MongoDB connection
mongoose.connect('mongodb://localhost:27017/order-management', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});
const db = mongoose.connection;
db.once('open', () => {
    console.log('Connected to MongoDB');
});

// Define Order schema and model using Mongoose
const orderSchema = new mongoose.Schema({
    orderId: String,
    customer: String,
    date: String,
    product: String,
    quantity: Number,
    unitPrice: Number
});

const Order = mongoose.model('Order', orderSchema);

// Configure multer storage for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Specify the directory to save the uploaded files
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname); // Use the original file name
    },
});

const upload = multer({ storage });

// API endpoint for file upload
app.post('/upload', upload.single('file'), (req, res) => {
    const filePath = req.file.path;

    fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', async (data) => {
            try {
                // Validate and parse quantity and unitPrice
                const quantity = parseInt(data.Quantity);
                const unitPrice = parseFloat(data['Unit Price']);

                // Check if the parsed values are valid numbers
                if (!isNaN(quantity) && !isNaN(unitPrice)) {
                    // Save order data to MongoDB
                    const order = new Order({
                        orderId: data['Order ID'],
                        customer: data.Customer,
                        date: data['Order Date'],
                        product: data['Item Name'],
                        quantity,
                        unitPrice,
                    });                    
                    await order.save();
                } else {
                    console.error('Invalid quantity or unitPrice:', data);
                }
            } catch (err) {
                console.error('Error saving order:', err);
            }
        })
        .on('end', () => {
            fs.unlinkSync(filePath); // Remove uploaded file
            res.status(200).send('File uploaded and orders saved to the database');
        });
});

// Define the route for generating the invoice PDF
app.get('/invoice/:id', async (req, res) => {
    try {
      const orderId = req.params.id;
  
      // Fetch order data from the database based on the provided ID
      const order = await Order.findById(orderId);
  
      // Create a new PDF document
      const doc = new PDFDocument();
  
      // Set the response headers for PDF
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="invoice_${order.orderId}.pdf"`);
  
      // Pipe the PDF document to the response stream
      doc.pipe(res);
  
      // Generate the PDF content
      
    doc.fontSize(18).text(`Invoice for Order ID: ${order.orderId}`);
    doc.moveDown();
    doc.fontSize(12).text(`Customer: ${order.customer}`);
    doc.fontSize(12).text(`Date: ${order.date}`);
    doc.moveDown();
    doc.fontSize(14).text('Product Details');
    doc.fontSize(12).text(`Product: ${order.product}`);
    doc.fontSize(12).text(`Quantity: ${order.quantity}`);
    doc.fontSize(12).text(`Unit Price: ${order.unitPrice}`);
    doc.moveDown();
    doc.fontSize(16).text(`Total Amount: ${order.quantity * order.unitPrice}`);

  
      // Finalize the PDF document
      doc.end();
    } catch (err) {
      console.error('Error generating invoice:', err);
      res.status(500).send('Error generating invoice');
    }
  });


// API endpoint for retrieving orders
app.get('/orders', (req, res) => {
    Order.find({})
        .then((orders) => {
            res.json(orders);
        })
        .catch((err) => {
            console.error('Error fetching orders:', err);
            res.status(500).send('Error fetching orders');
        });
});


// Start the server
app.listen(5000, () => {
    console.log('Server started on port 5000');
});

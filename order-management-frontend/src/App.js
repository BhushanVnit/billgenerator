import React, { useState } from 'react';
import axios from 'axios';
import { BrowserRouter as Router, Switch, Route, Link } from 'react-router-dom';
import { Container, Button, Table, Modal } from '@mui/material';

function App() {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Function to handle file upload
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    const formData = new FormData();
    formData.append('file', file);

    axios
      .post('http://localhost:5000/upload', formData)
      .then((res) => {
        console.log(res.data);
        // Fetch the updated list of orders
        fetchOrders();
      })
      .catch((err) => {
        console.error('Error uploading file:', err);
      });
  };

  // Function to fetch the list of orders from the backend
  const fetchOrders = () => {
    axios
      .get('http://localhost:5000/orders')
      .then((res) => {
        setOrders(res.data);
      })
      .catch((err) => {
        console.error('Error fetching orders:', err);
      });
  };

  // Function to handle order click and open the modal
  const handleOrderClick = (order) => {
    setSelectedOrder(order);
    setModalOpen(true);
  };

  // Function to generate the invoice for a specific order
  const generateInvoice = (order) => {
    axios
      .get(`http://localhost:5000/invoice/${order._id}`, { responseType: 'blob' })
      .then((res) => {
        const url = window.URL.createObjectURL(new Blob([res.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `invoice_${order.orderId}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
      })
      .catch((err) => {
        console.error('Error generating invoice:', err);
      });
  };

  // Fetch the initial list of orders
  useState(() => {
    fetchOrders();
  }, []);

  return (
    <Container>
      <input type="file" accept=".csv" onChange={handleFileUpload} />
      <Table>
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Customer</th>
            <th>Date</th>
            <th>Product</th>
            <th>Quantity</th>
            <th>Unit Price</th>
            <th>Total Amount</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order._id} onClick={() => handleOrderClick(order)}>
              <td>{order.orderId}</td>
              <td>{order.customer}</td>
              <td>{order.date}</td>
              <td>{order.product}</td>
              <td>{order.quantity}</td>
              <td>{order.unitPrice}</td>
              <td>{order.quantity * order.unitPrice}</td>
            </tr>
          ))}
        </tbody>
      </Table>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
        <div>
          <h2>Order Details</h2>
          {selectedOrder && (
            <div>
              <p>Order ID: {selectedOrder.orderId}</p>
              <p>Customer: {selectedOrder.customer}</p>
              <p>Date: {selectedOrder.date}</p>
              <p>Product: {selectedOrder.product}</p>
              <p>Quantity: {selectedOrder.quantity}</p>
              <p>Unit Price: {selectedOrder.unitPrice}</p>
              <Button variant="contained" onClick={() => generateInvoice(selectedOrder)}>
                Generate Invoice
              </Button>
            </div>
          )}
        </div>
      </Modal>
    </Container>
  );
}

function Routes() {
  return (
    <Router>
      <Switch>
        <Route exact path="/" component={App} />
      </Switch>
    </Router>
  );
}

export default Routes;

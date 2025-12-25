const express = require('express');
const router = express.Router();
const {
  getOrders,
  createOrder,
  updateOrder,
  deleteOrder,
  getOrderById,
  holdOrder,
  getHeldOrders,
  restoreOrder,
} = require('../controllers/orderController');

router.get('/', getOrders);
router.get('/held', getHeldOrders); // Phải đứng trước /:id
router.get('/:id', getOrderById);
router.post('/', createOrder);
router.post('/:id/hold', holdOrder);
router.post('/:id/restore', restoreOrder);
router.put('/:id', updateOrder);
router.delete('/:id', deleteOrder);

module.exports = router;




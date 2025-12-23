const express = require('express');
const router = express.Router();
const {
  getToppings,
  createTopping,
  updateTopping,
  deleteTopping,
} = require('../controllers/toppingController');

router.get('/', getToppings);
router.post('/', createTopping);
router.put('/:id', updateTopping);
router.delete('/:id', deleteTopping);

module.exports = router;


const Topping = require('../models/Topping');

// Lấy danh sách topping
const getToppings = async (req, res) => {
  try {
    const toppings = await Topping.find().sort({ createdAt: -1 });
    res.json(toppings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Tạo topping mới
const createTopping = async (req, res) => {
  try {
    const { name, price } = req.body;

    if (!name || price === undefined) {
      return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin' });
    }

    const topping = new Topping({
      name,
      price: parseFloat(price),
    });

    await topping.save();
    res.status(201).json(topping);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Topping này đã tồn tại' });
    }
    res.status(500).json({ message: error.message });
  }
};

// Cập nhật topping
const updateTopping = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price } = req.body;

    const topping = await Topping.findById(id);
    if (!topping) {
      return res.status(404).json({ message: 'Không tìm thấy topping' });
    }

    if (name) topping.name = name;
    if (price !== undefined) topping.price = parseFloat(price);

    await topping.save();
    res.json(topping);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Topping này đã tồn tại' });
    }
    res.status(500).json({ message: error.message });
  }
};

// Xóa topping
const deleteTopping = async (req, res) => {
  try {
    const { id } = req.params;
    const topping = await Topping.findById(id);

    if (!topping) {
      return res.status(404).json({ message: 'Không tìm thấy topping' });
    }

    await Topping.findByIdAndDelete(id);
    res.json({ message: 'Đã xóa topping thành công' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getToppings,
  createTopping,
  updateTopping,
  deleteTopping,
};




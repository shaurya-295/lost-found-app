const express = require('express');
const router = express.Router();
const Item = require('../models/Item');
const { protect } = require('../middleware/authMiddleware');

// GET /api/items/search?name=xyz
// NOTE: Must be BEFORE /:id route
router.get('/search', protect, async (req, res) => {
  try {
    const { name } = req.query;
    const query = name ? { itemName: { $regex: name, $options: 'i' } } : {};
    const items = await Item.find(query).populate('postedBy', 'name email');
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: 'Server error during search' });
  }
});

// POST /api/items
router.post('/', protect, async (req, res) => {
  const { itemName, description, type, location, date, contactInfo } = req.body;
  try {
    if (!itemName || !description || !type || !location || !date || !contactInfo) {
      return res.status(400).json({ message: 'Please fill in all fields' });
    }
    const item = await Item.create({
      itemName, description, type, location, date, contactInfo,
      postedBy: req.user._id,
    });
    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({ message: 'Server error while adding item' });
  }
});

// GET /api/items
router.get('/', protect, async (req, res) => {
  try {
    const items = await Item.find()
      .populate('postedBy', 'name email')
      .sort({ createdAt: -1 });
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: 'Server error while fetching items' });
  }
});

// GET /api/items/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id).populate('postedBy', 'name email');
    if (!item) return res.status(404).json({ message: 'Item not found' });
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: 'Server error while fetching item' });
  }
});

// PUT /api/items/:id
router.put('/:id', protect, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });

    if (item.postedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this item' });
    }

    const updatedItem = await Item.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    res.json(updatedItem);
  } catch (error) {
    res.status(500).json({ message: 'Server error while updating item' });
  }
});

// DELETE /api/items/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });

    if (item.postedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this item' });
    }

    await item.deleteOne();
    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error while deleting item' });
  }
});

module.exports = router;
const express = require('express');
const {
  createExpense,
  getExpenses,
  updateExpense,
  deleteExpense,
} = require('../controllers/expenseController');
const { protect } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

const router = express.Router();

router.use(protect); // All expense operations require authentication

// POST /api/v1/expenses -> Add expense (handles optional single file upload named 'receipt')
router.post('/', upload.single('receipt'), createExpense);

// GET /api/v1/expenses -> Get expenses with pagination & filters
router.get('/', getExpenses);

// PUT /api/v1/expenses/:id -> Update expense (handles optional replacement file upload)
router.put('/:id', upload.single('receipt'), updateExpense);

// DELETE /api/v1/expenses/:id -> Delete expense and its receipt
router.delete('/:id', deleteExpense);

module.exports = router;

const express = require('express');
const {
  getBalancesAndSuggestions,
  createSettlement,
  getSettlementHistory,
} = require('../controllers/settlementController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect); // All settlement routes require authentication

router.get('/balances', getBalancesAndSuggestions);
router.post('/', createSettlement);
router.get('/history', getSettlementHistory);

module.exports = router;

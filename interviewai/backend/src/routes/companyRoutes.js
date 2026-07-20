const express = require('express');
const { protect, requireRole } = require('../middleware/auth');
const { listCompanies, getCompany, createCompany, updateCompany } = require('../controllers/companyController');

const router = express.Router();

router.get('/', listCompanies);
router.get('/:slug', getCompany);
router.post('/', protect, requireRole('admin'), createCompany);
router.patch('/:id', protect, requireRole('admin'), updateCompany);

module.exports = router;

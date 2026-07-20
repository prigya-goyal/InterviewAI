const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const Company = require('../models/Company');

// GET /api/companies
const listCompanies = asyncHandler(async (req, res) => {
  const companies = await Company.find().select('name slug logoUrl description difficultyProfile');
  res.json({ success: true, companies });
});

// GET /api/companies/:slug
const getCompany = asyncHandler(async (req, res) => {
  const company = await Company.findOne({ slug: req.params.slug }).populate(
    'frequentProblems',
    'title slug difficulty tags'
  );
  if (!company) throw new ApiError(404, 'Company not found.');
  res.json({ success: true, company });
});

// POST /api/companies  (admin)
const createCompany = asyncHandler(async (req, res) => {
  const company = await Company.create(req.body);
  res.status(201).json({ success: true, company });
});

// PATCH /api/companies/:id  (admin)
const updateCompany = asyncHandler(async (req, res) => {
  const company = await Company.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!company) throw new ApiError(404, 'Company not found.');
  res.json({ success: true, company });
});

module.exports = { listCompanies, getCompany, createCompany, updateCompany };

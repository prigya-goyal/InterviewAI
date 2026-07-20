const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const User = require('../models/User');
const Problem = require('../models/Problem');
const Interview = require('../models/Interview');
const Submission = require('../models/Submission');
const Contest = require('../models/Contest');
const Company = require('../models/Company');

// GET /api/admin/overview — top-line platform analytics
const getOverview = asyncHandler(async (req, res) => {
  const [totalUsers, totalProblems, totalSubmissions, totalInterviews, activeContests] = await Promise.all([
    User.countDocuments(),
    Problem.countDocuments(),
    Submission.countDocuments(),
    Interview.countDocuments(),
    Contest.countDocuments({ endTime: { $gte: new Date() } }),
  ]);

  res.json({
    success: true,
    overview: { totalUsers, totalProblems, totalSubmissions, totalInterviews, activeContests },
  });
});

// GET /api/admin/users?page=1&limit=25
const listUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 25, search } = req.query;
  const filter = search ? { $or: [{ name: new RegExp(search, 'i') }, { email: new RegExp(search, 'i') }] } : {};

  const users = await User.find(filter)
    .select('name email role isActive xp problemsSolved createdAt')
    .skip((page - 1) * limit)
    .limit(Number(limit));
  const total = await User.countDocuments(filter);

  res.json({ success: true, users, total, page: Number(page), pages: Math.ceil(total / limit) });
});

// PATCH /api/admin/users/:id  — e.g. deactivate, promote to admin
const updateUser = asyncHandler(async (req, res) => {
  const allowed = ['role', 'isActive'];
  const updates = {};
  for (const field of allowed) if (req.body[field] !== undefined) updates[field] = req.body[field];

  const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true });
  if (!user) throw new ApiError(404, 'User not found.');
  res.json({ success: true, user: user.toSafeObject() });
});

// POST /api/admin/problems
const createProblem = asyncHandler(async (req, res) => {
  const problem = await Problem.create({ ...req.body, createdBy: req.user._id });
  res.status(201).json({ success: true, problem });
});

// PATCH /api/admin/problems/:id
const updateProblem = asyncHandler(async (req, res) => {
  const problem = await Problem.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!problem) throw new ApiError(404, 'Problem not found.');
  res.json({ success: true, problem });
});

// DELETE /api/admin/problems/:id
const deleteProblem = asyncHandler(async (req, res) => {
  const problem = await Problem.findByIdAndDelete(req.params.id);
  if (!problem) throw new ApiError(404, 'Problem not found.');
  res.json({ success: true, message: 'Problem deleted.' });
});

// --- Company CRUD ---

// GET /api/admin/companies?page=1&limit=25
const listCompanies = asyncHandler(async (req, res) => {
  const { page = 1, limit = 25, search } = req.query;
  const filter = search ? { name: new RegExp(search, 'i') } : {};

  const companies = await Company.find(filter)
    .skip((page - 1) * limit)
    .limit(Number(limit));
  const total = await Company.countDocuments(filter);

  res.json({ success: true, companies, total, page: Number(page), pages: Math.ceil(total / limit) });
});

// POST /api/admin/companies
const createCompany = asyncHandler(async (req, res) => {
  const company = await Company.create(req.body);
  res.status(201).json({ success: true, company });
});

// PATCH /api/admin/companies/:id
const updateCompany = asyncHandler(async (req, res) => {
  const company = await Company.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!company) throw new ApiError(404, 'Company not found.');
  res.json({ success: true, company });
});

// DELETE /api/admin/companies/:id
const deleteCompany = asyncHandler(async (req, res) => {
  const company = await Company.findByIdAndDelete(req.params.id);
  if (!company) throw new ApiError(404, 'Company not found.');
  res.json({ success: true, message: 'Company deleted.' });
});

// --- Contest CRUD ---

// GET /api/admin/contests?page=1&limit=25
const listContests = asyncHandler(async (req, res) => {
  const { page = 1, limit = 25, search } = req.query;
  const filter = search ? { title: new RegExp(search, 'i') } : {};

  const contests = await Contest.find(filter)
    .skip((page - 1) * limit)
    .limit(Number(limit))
    .populate('problems', 'title slug');
  const total = await Contest.countDocuments(filter);

  res.json({ success: true, contests, total, page: Number(page), pages: Math.ceil(total / limit) });
});

// POST /api/admin/contests
const createContest = asyncHandler(async (req, res) => {
  const contest = await Contest.create({ ...req.body, createdBy: req.user._id });
  res.status(201).json({ success: true, contest });
});

// PATCH /api/admin/contests/:id
const updateContest = asyncHandler(async (req, res) => {
  const contest = await Contest.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!contest) throw new ApiError(404, 'Contest not found.');
  res.json({ success: true, contest });
});

// DELETE /api/admin/contests/:id
const deleteContest = asyncHandler(async (req, res) => {
  const contest = await Contest.findByIdAndDelete(req.params.id);
  if (!contest) throw new ApiError(404, 'Contest not found.');
  res.json({ success: true, message: 'Contest deleted.' });
});

module.exports = {
  getOverview,
  listUsers,
  updateUser,
  createProblem,
  updateProblem,
  deleteProblem,
  listCompanies,
  createCompany,
  updateCompany,
  deleteCompany,
  listContests,
  createContest,
  updateContest,
  deleteContest,
};


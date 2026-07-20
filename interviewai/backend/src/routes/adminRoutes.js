const express = require('express');
const { protect, requireRole } = require('../middleware/auth');
const {
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
} = require('../controllers/adminController');

const router = express.Router();

router.use(protect, requireRole('admin'));

router.get('/overview', getOverview);

router.get('/users', listUsers);
router.patch('/users/:id', updateUser);

router.post('/problems', createProblem);
router.patch('/problems/:id', updateProblem);
router.delete('/problems/:id', deleteProblem);

router.get('/companies', listCompanies);
router.post('/companies', createCompany);
router.patch('/companies/:id', updateCompany);
router.delete('/companies/:id', deleteCompany);

router.get('/contests', listContests);
router.post('/contests', createContest);
router.patch('/contests/:id', updateContest);
router.delete('/contests/:id', deleteContest);

module.exports = router;


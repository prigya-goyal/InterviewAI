const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const Contest = require('../models/Contest');
const Submission = require('../models/Submission');

// GET /api/contests
const listContests = asyncHandler(async (req, res) => {
  const contests = await Contest.find().sort('-startTime').select('-participants');
  res.json({ success: true, contests });
});

// GET /api/contests/:slug
const getContest = asyncHandler(async (req, res) => {
  const contest = await Contest.findOne({ slug: req.params.slug }).populate('problems', 'title slug difficulty');
  if (!contest) throw new ApiError(404, 'Contest not found.');
  res.json({ success: true, contest });
});

// POST /api/contests/:slug/register
const registerForContest = asyncHandler(async (req, res) => {
  const contest = await Contest.findOne({ slug: req.params.slug });
  if (!contest) throw new ApiError(404, 'Contest not found.');

  const alreadyIn = contest.participants.some((p) => p.user.toString() === req.user._id.toString());
  if (alreadyIn) throw new ApiError(409, 'Already registered for this contest.');

  contest.participants.push({ user: req.user._id });
  await contest.save();

  res.json({ success: true, message: 'Registered.' });
});

// GET /api/contests/:slug/leaderboard
const getContestLeaderboard = asyncHandler(async (req, res) => {
  const contest = await Contest.findOne({ slug: req.params.slug }).populate('participants.user', 'name avatar');
  if (!contest) throw new ApiError(404, 'Contest not found.');

  const ranked = [...contest.participants].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return (a.finishTime?.getTime() || Infinity) - (b.finishTime?.getTime() || Infinity);
  });

  res.json({ success: true, leaderboard: ranked });
});

// POST /api/contests (admin) — create a timed or virtual contest
const createContest = asyncHandler(async (req, res) => {
  const contest = await Contest.create({ ...req.body, createdBy: req.user._id });
  res.status(201).json({ success: true, contest });
});

// Recomputes a participant's contest score after a submission is judged.
// Called from problemController when contestId is present in the submit request
async function recomputeParticipantScore({ contestId, userId }) {
  const contest = await Contest.findById(contestId);
  if (!contest) return;

  const participant = contest.participants.find((p) => p.user.toString() === userId.toString());
  if (!participant) return;

  const timeQuery = contest.isVirtual
    ? { $gte: new Date(Date.now() - contest.durationMinutes * 60 * 1000) }
    : { $gte: contest.startTime, $lte: contest.endTime };

  const acceptedSubs = await Submission.find({
    user: userId,
    problem: { $in: contest.problems },
    status: 'Accepted',
    createdAt: timeQuery,
  }).distinct('problem');

  participant.problemsSolved = acceptedSubs.length;
  participant.score = acceptedSubs.length * 100; // simple scoring
  await contest.save();
}

module.exports = {
  listContests,
  getContest,
  registerForContest,
  getContestLeaderboard,
  createContest,
  recomputeParticipantScore,
};

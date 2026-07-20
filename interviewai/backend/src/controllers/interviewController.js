const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const Interview = require('../models/Interview');
const Problem = require('../models/Problem');
const { getInterviewerTurn, getHrInterviewerTurn, getSystemDesignInterviewerTurn, evaluateInterview } = require('../services/openaiService');
const { awardBadgesAndAchievements } = require('../services/gamificationService');

// POST /api/interviews/start   { type: 'dsa'|'hr'|'system_design', companyId? }
// NOTE: Once started, ongoing turns typically flow over the Socket.io
// `interview:message` event (see services/socketService.js) for a live feel.
// This REST endpoint is for clients that prefer request/response polling,
// and for creating the Interview document itself.
const startInterview = asyncHandler(async (req, res) => {
  const { type = 'dsa', companyId = null } = req.body;

  let starterProblem = null;
  if (type === 'dsa') {
    // Pick an appropriate opening problem — Easy/Medium mix, optionally scoped to a company.
    const filter = { difficulty: 'Easy' };
    if (companyId) filter.companies = companyId;
    starterProblem = await Problem.findOne(filter);
  }

  const interview = await Interview.create({
    user: req.user._id,
    type,
    company: companyId,
    problems: starterProblem ? [starterProblem._id] : [],
  });

  const introMessage =
    type === 'hr'
      ? await getHrInterviewerTurn({ transcript: [], candidateInput: '[Interview started]' })
      : type === 'system_design'
      ? await getSystemDesignInterviewerTurn({ transcript: [], candidateInput: '[Interview started]' })
      : await getInterviewerTurn({
          transcript: [],
          currentProblem: starterProblem,
          candidateInput: '[Interview started]',
        });

  interview.transcript.push({ speaker: 'ai', message: introMessage, type: 'intro' });
  await interview.save();

  res.status(201).json({ success: true, interview });
});

// POST /api/interviews/:id/message   { message, type }
// REST fallback for the same flow the socket handler drives.
const postMessage = asyncHandler(async (req, res) => {
  const interview = await Interview.findOne({ _id: req.params.id, user: req.user._id });
  if (!interview) throw new ApiError(404, 'Interview not found.');
  if (interview.status !== 'in_progress') throw new ApiError(400, 'This interview has already ended.');

  const { message, type = 'answer' } = req.body;
  interview.transcript.push({ speaker: 'user', message, type });

  const currentProblem = interview.problems.length
    ? await Problem.findById(interview.problems[interview.problems.length - 1])
    : null;

  const aiReply =
    interview.type === 'hr'
      ? await getHrInterviewerTurn({ transcript: interview.transcript, candidateInput: message })
      : interview.type === 'system_design'
      ? await getSystemDesignInterviewerTurn({ transcript: interview.transcript, candidateInput: message })
      : await getInterviewerTurn({
          transcript: interview.transcript,
          currentProblem,
          candidateInput: message,
          requestedHint: type === 'hint',
        });

  interview.transcript.push({ speaker: 'ai', message: aiReply, type: type === 'hint' ? 'hint' : 'question' });
  await interview.save();

  res.json({ success: true, message: aiReply, interview });
});

// POST /api/interviews/:id/end
const endInterview = asyncHandler(async (req, res) => {
  const interview = await Interview.findOne({ _id: req.params.id, user: req.user._id });
  if (!interview) throw new ApiError(404, 'Interview not found.');

  interview.status = 'completed';
  interview.endedAt = new Date();
  interview.durationSeconds = Math.round((interview.endedAt - interview.startedAt) / 1000);

  interview.evaluation = await evaluateInterview({ transcript: interview.transcript });

  await interview.save();

  // Award badges and achievements
  const unlocked = await awardBadgesAndAchievements(req.user._id);

  res.json({ success: true, interview, unlocked });
});

// GET /api/interviews  — interview history for the current user
const listMyInterviews = asyncHandler(async (req, res) => {
  const interviews = await Interview.find({ user: req.user._id })
    .sort('-createdAt')
    .populate('problems', 'title difficulty')
    .populate('company', 'name logoUrl');
  res.json({ success: true, interviews });
});

// GET /api/interviews/:id
const getInterview = asyncHandler(async (req, res) => {
  const interview = await Interview.findOne({ _id: req.params.id, user: req.user._id })
    .populate('problems')
    .populate('company', 'name logoUrl');
  if (!interview) throw new ApiError(404, 'Interview not found.');
  res.json({ success: true, interview });
});

module.exports = { startInterview, postMessage, endInterview, listMyInterviews, getInterview };

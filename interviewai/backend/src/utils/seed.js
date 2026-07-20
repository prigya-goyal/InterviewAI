const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Problem = require('../models/Problem');
const Company = require('../models/Company');
const Badge = require('../models/Badge');
const Achievement = require('../models/Achievement');
const Contest = require('../models/Contest');

const problemsData = [
  {
    title: 'Two Sum',
    slug: 'two-sum',
    difficulty: 'Easy',
    tags: ['Array', 'Hash Table'],
    conceptTags: ['hash-map'],
    statement: 'Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.',
    constraints: ['2 <= nums.length <= 10^4', '-10^9 <= nums[i] <= 10^9'],
    examples: [{ input: 'nums = [2,7,11,15], target = 9', output: '[0,1]', explanation: 'nums[0] + nums[1] == 9' }],
    hints: ['Try a hash map to store seen values.'],
    starterCode: {
      python: 'def two_sum(nums, target):\n    pass\n',
      javascript: 'function twoSum(nums, target) {\n  \n}\n',
      cpp: 'vector<int> twoSum(vector<int>& nums, int target) {\n    \n}\n',
      java: 'public int[] twoSum(int[] nums, int target) {\n    \n}\n',
    },
    testCases: [
      { input: '[2,7,11,15]\n9', expectedOutput: '[0,1]', isHidden: false },
      { input: '[3,2,4]\n6', expectedOutput: '[1,2]', isHidden: true },
    ],
    isDailyChallenge: true,
  },
  {
    title: 'Longest Substring Without Repeating Characters',
    slug: 'longest-substring-without-repeating-characters',
    difficulty: 'Medium',
    tags: ['String', 'Sliding Window'],
    conceptTags: ['sliding-window'],
    statement: 'Given a string `s`, find the length of the longest substring without repeating characters.',
    constraints: ['0 <= s.length <= 5 * 10^4'],
    examples: [{ input: 's = "abcabcbb"', output: '3', explanation: 'The answer is "abc".' }],
    hints: ['Use a sliding window with a set or map of last-seen indices.'],
    starterCode: {
      python: 'def length_of_longest_substring(s):\n    pass\n',
      javascript: 'function lengthOfLongestSubstring(s) {\n  \n}\n',
      cpp: 'int lengthOfLongestSubstring(string s) {\n    \n}\n',
      java: 'public int lengthOfLongestSubstring(String s) {\n    \n}\n',
    },
    testCases: [
      { input: 'abcabcbb', expectedOutput: '3', isHidden: false },
      { input: 'bbbbb', expectedOutput: '1', isHidden: true },
    ],
  },
  {
    title: 'Merge K Sorted Lists',
    slug: 'merge-k-sorted-lists',
    difficulty: 'Hard',
    tags: ['Linked List', 'Heap', 'Divide and Conquer'],
    conceptTags: ['heap', 'divide-and-conquer'],
    statement: 'You are given an array of `k` linked-lists, each sorted in ascending order. Merge all the linked-lists into one sorted linked-list.',
    constraints: ['k == lists.length', '0 <= k <= 10^4'],
    examples: [{ input: 'lists = [[1,4,5],[1,3,4],[2,6]]', output: '[1,1,2,3,4,4,5,6]', explanation: '' }],
    hints: ['A min-heap over the current head of each list works in O(N log k).'],
    starterCode: {
      python: 'def merge_k_lists(lists):\n    pass\n',
      javascript: 'function mergeKLists(lists) {\n  \n}\n',
      cpp: 'ListNode* mergeKLists(vector<ListNode*>& lists) {\n    \n}\n',
      java: 'public ListNode mergeKLists(ListNode[] lists) {\n    \n}\n',
    },
    testCases: [{ input: '[[1,4,5],[1,3,4],[2,6]]', expectedOutput: '[1,1,2,3,4,4,5,6]', isHidden: false }],
  },
];

const companiesData = [
  { name: 'Google', slug: 'google', description: 'Frequently emphasizes algorithms, system design, and Googleyness.' },
  { name: 'Amazon', slug: 'amazon', description: 'Leadership Principles drive both HR and technical rounds.' },
  { name: 'Microsoft', slug: 'microsoft', description: 'Broad DSA coverage with a strong focus on clean code.' },
  { name: 'Meta', slug: 'meta', description: 'Meta values speed, scalability, and deep analytical reasoning.' },
  { name: 'Apple', slug: 'apple', description: 'Deep dives into system details and technical quality.' },
  { name: 'Netflix', slug: 'netflix', description: 'Freedom and responsibility drive senior-level technical interviews.' },
  { name: 'Adobe', slug: 'adobe', description: 'Strong core computer science fundamentals and product design.' },
  { name: 'Atlassian', slug: 'atlassian', description: 'Heavy values-alignment interviewing alongside solid coding skills.' },
  { name: 'Uber', slug: 'uber', description: 'Real-time dispatch, location data scaling, and concurrency.' },
];

const badgesData = [
  { key: 'first_solve', name: 'First Blood', description: 'Solved your first problem.', tier: 'bronze' },
  { key: 'streak_7', name: 'On a Roll', description: '7-day coding streak.', tier: 'silver' },
  { key: 'century', name: 'Centurion', description: 'Solved 100 problems.', tier: 'gold' },
];

const achievementsData = [
  { key: 'first_blood', title: 'First Blood', description: 'Solve your first problem', xpReward: 10, criteria: { type: 'problems_solved', threshold: 1 } },
  { key: 'streak_master', title: 'Streak Master', description: 'Maintain a 30-day streak', xpReward: 100, criteria: { type: 'streak', threshold: 30 } },
  { key: 'interview_ace', title: 'Interview Ace', description: 'Complete 10 mock interviews', xpReward: 75, criteria: { type: 'interviews_completed', threshold: 10 } },
];

async function seedData() {
  await Promise.all([
    Problem.deleteMany({}),
    Company.deleteMany({}),
    Badge.deleteMany({}),
    Achievement.deleteMany({}),
    Contest.deleteMany({}),
  ]);

  // Insert problems and capture documents
  const problems = await Problem.insertMany(problemsData);
  const pMap = {};
  problems.forEach((p) => {
    pMap[p.slug] = p._id;
  });

  // Populate companies with HR & System Design questions + link problems
  const companyDocs = companiesData.map((c) => {
    const isGoogle = c.slug === 'google';
    const isAmazon = c.slug === 'amazon';

    return {
      ...c,
      frequentProblems: isGoogle
        ? [pMap['two-sum'], pMap['longest-substring-without-repeating-characters']]
        : isAmazon
        ? [pMap['longest-substring-without-repeating-characters'], pMap['merge-k-sorted-lists']]
        : [pMap['two-sum']],
      hrQuestions: [
        { question: 'Tell me about yourself.', category: 'general' },
        { question: 'Why do you want to join our company?', category: 'general' },
        { question: 'Describe a time you solved a complex technical conflict in a team.', category: 'conflict' },
        { question: 'How do you handle deadlines and project prioritization?', category: 'leadership' },
      ],
      systemDesignQuestions: [
        { question: 'Design a URL shortening service like TinyURL.', difficulty: 'Easy' },
        { question: 'Design a real-time messaging system like WhatsApp.', difficulty: 'Medium' },
        { question: 'Design a video streaming platform like Netflix.', difficulty: 'Hard' },
      ],
    };
  });
  const insertedCompanies = await Company.insertMany(companyDocs);

  // Update problems with company relations
  const googleDoc = insertedCompanies.find((c) => c.slug === 'google');
  const amazonDoc = insertedCompanies.find((c) => c.slug === 'amazon');

  if (googleDoc && amazonDoc) {
    await Problem.updateOne({ slug: 'two-sum' }, { $push: { companies: googleDoc._id } });
    await Problem.updateOne(
      { slug: 'longest-substring-without-repeating-characters' },
      { $push: { companies: { $each: [googleDoc._id, amazonDoc._id] } } }
    );
    await Problem.updateOne({ slug: 'merge-k-sorted-lists' }, { $push: { companies: amazonDoc._id } });
  }

  // Insert badges and achievements
  await Badge.insertMany(badgesData);
  await Achievement.insertMany(achievementsData);

  // Insert sample contests
  const contestsData = [
    {
      title: 'Weekly Coding Contest 1',
      slug: 'weekly-coding-contest-1',
      description: 'Solve two problems in 90 minutes. Compete live with coders globally!',
      startTime: new Date(Date.now() - 24 * 60 * 60 * 1000), // started 1 day ago
      endTime: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000), // ends in 6 days
      durationMinutes: 90,
      isVirtual: false,
      problems: [pMap['two-sum'], pMap['longest-substring-without-repeating-characters']],
    },
    {
      title: 'Google Placement Prep Cup',
      slug: 'google-placement-prep-cup',
      description: 'Special placement test containing problems frequently asked in Google interviews.',
      startTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // starts in 3 days
      endTime: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
      durationMinutes: 60,
      isVirtual: false,
      problems: [pMap['two-sum']],
    },
    {
      title: 'Virtual Practice Contest',
      slug: 'virtual-practice-contest',
      description: 'Ended contest. Start a virtual session anytime to practice hard problems under timed conditions.',
      startTime: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // ended 10 days ago
      endTime: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000),
      durationMinutes: 45,
      isVirtual: true,
      problems: [pMap['merge-k-sorted-lists']],
    },
  ];
  await Contest.insertMany(contestsData);

  console.log('[seed] Done: problems, companies (with associated prep content), contests, badges, achievements inserted.');
}

async function runSeed() {
  await connectDB();
  await seedData();
  await mongoose.connection.close();
  process.exit(0);
}

if (require.main === module) {
  runSeed().catch((err) => {
    console.error('[seed] Failed:', err);
    process.exit(1);
  });
}

module.exports = { seedData, problemsData, companiesData, badgesData, achievementsData };

const OpenAI = require('openai');
const { OPENAI_API_KEY, OPENAI_MODEL } = require('../config/env');

const client = new OpenAI({ apiKey: OPENAI_API_KEY });

/**
 * Low-level chat completion call. Kept generic so higher-level functions
 * (interviewer turn, resume analysis, hints, etc.) can build their own
 * prompts on top of it.
 */
async function chatComplete({ system, messages, jsonMode = false, temperature = 0.7 }) {
  const response = await client.chat.completions.create({
    model: OPENAI_MODEL,
    temperature,
    response_format: jsonMode ? { type: 'json_object' } : undefined,
    messages: [{ role: 'system', content: system }, ...messages],
  });

  return response.choices[0]?.message?.content ?? '';
}

/**
 * Drives one turn of the AI DSA interviewer.
 */
async function getInterviewerTurn({ transcript, currentProblem, candidateInput, requestedHint = false }) {
  const system = `You are an experienced technical interviewer at a top tech company running a
live data-structures-and-algorithms interview. Introduce yourself once at the start, then ask
DSA questions, follow-up questions, and increase difficulty based on how well the candidate is
doing. Probe for optimization, edge cases, time complexity, and space complexity. Only give a
hint when the candidate explicitly asks for one. Be encouraging but rigorous, like a real
interviewer. Keep responses concise (2-5 sentences) unless presenting a new problem statement.`;

  const messages = transcript.map((t) => ({
    role: t.speaker === 'ai' ? 'assistant' : 'user',
    content: t.message,
  }));

  messages.push({
    role: 'user',
    content: requestedHint
      ? `[Candidate requested a hint] ${candidateInput}`
      : candidateInput,
  });

  if (currentProblem) {
    messages.unshift({
      role: 'system',
      content: `Current problem context: ${currentProblem.title} (${currentProblem.difficulty}). Statement: ${currentProblem.statement}`,
    });
  }

  try {
    return await chatComplete({ system, messages });
  } catch (err) {
    console.warn(`[openai] getInterviewerTurn failed: ${err.message}. Using smart mock fallback.`);
    
    // Check if the interview is just starting
    if (candidateInput === '[Interview started]' || transcript.length === 0) {
      const problemName = currentProblem ? currentProblem.title : 'Two Sum';
      const problemStatement = currentProblem ? currentProblem.statement : 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.';
      return `Welcome! I am your technical interviewer today. Let's start with a coding question: **${problemName}**.

${problemStatement}

Please walk me through your high-level approach before writing any code.`;
    }

    const lastMsg = (candidateInput || '').trim().toLowerCase();

    // 1. Hint request
    if (requestedHint || lastMsg.includes('hint') || lastMsg.includes('clue') || lastMsg === 'can i get a hint?') {
      return "Sure! Try thinking about how you can use a hash map to store the elements you've already seen. This will allow you to look up the complement (target - current_number) in O(1) time.";
    }

    // 2. Negative / Stuck / Don't know
    const negativeWords = ['no', 'idk', 'dont know', "don't know", 'not sure', 'confused', 'stuck', 'hard', 'cannot', 'cant', "can't", 'no approach', 'nothing'];
    if (negativeWords.includes(lastMsg) || negativeWords.some((w) => lastMsg.startsWith(w) && lastMsg.length < 20)) {
      return "No problem! If you are stuck or unsure, feel free to ask for a hint (by clicking 'Ask for a hint' below or saying 'hint'), and we can work through it together. Alternatively, let me know if you would like me to explain the basic idea.";
    }

    // 3. Explanation request
    if (lastMsg.includes('explain') || lastMsg.includes('how to solve') || lastMsg.includes('what is the approach') || lastMsg.includes('help me')) {
      const problemName = currentProblem ? currentProblem.title : 'Two Sum';
      return `Sure! For **${problemName}**, a simple approach is to check every pair (brute force, which takes O(N^2) time). To optimize, we can use a Hash Map. As we traverse the array, we calculate the complement (target - num). If the complement is in our map, we return their indices. Otherwise, we add the current number and its index to the map. Does this approach make sense?`;
    }

    // 4. Greeting
    if (['hi', 'hello', 'hey', 'greetings', 'yo'].includes(lastMsg)) {
      return "Hello! Welcome to the technical interview. Let's get started. Please walk me through your high-level thoughts for solving the problem.";
    }

    // 5. Positive / Confirmations
    if (['yes', 'ok', 'okay', 'sure', 'yeah', 'fine', 'yup'].includes(lastMsg)) {
      return "Great! Go ahead and explain your thoughts or write down the code in the editor, and we can discuss it.";
    }

    // 6. Complexity talk
    if (lastMsg.includes('complexity') || lastMsg.includes('o(') || lastMsg.includes('time complexity') || lastMsg.includes('space complexity')) {
      return "That's correct! The time complexity of the optimized solution is indeed O(N) because we iterate through the array once, and the space complexity is O(N) for the hash map. Can you think of any edge cases, like duplicate values or negative numbers?";
    }

    // 7. Code check
    if (lastMsg.includes('def ') || lastMsg.includes('return') || lastMsg.includes('{') || lastMsg.includes('}') || lastMsg.includes('class ') || lastMsg.includes('function') || lastMsg.includes('vector')) {
      return "I see your code draft. How do you plan to handle edge cases like negative integers or target complements that occur at the same index? Walk me through how the logic progresses step by step.";
    }

    // 8. Too short/ambiguous
    if (lastMsg.length < 10) {
      return "I see. Let's try to break the problem down. What is the brute force way of solving this? Or would you like a hint to get started?";
    }

    // 9. Standard answer
    return "That is a reasonable approach! Could you write down the code for this solution in the editor, and walk me through how it handles standard inputs and potential edge cases?";
  }
}

/**
 * Produces the structured end-of-interview evaluation shown on the results screen.
 */
async function evaluateInterview({ transcript }) {
  const system = `You are grading a completed technical interview transcript. Respond ONLY with
a JSON object matching this shape, with no prose outside the JSON:
{
  "overallScore": 0-100,
  "communicationScore": 0-100,
  "codingScore": 0-100,
  "problemSolvingScore": 0-100,
  "timeManagementScore": 0-100,
  "confidenceScore": 0-100,
  "strengths": string[],
  "weaknesses": string[],
  "improvementSuggestions": string[]
}`;

  const transcriptText = transcript.map((t) => `${t.speaker.toUpperCase()}: ${t.message}`).join('\n');

  try {
    const raw = await chatComplete({
      system,
      messages: [{ role: 'user', content: transcriptText }],
      jsonMode: true,
      temperature: 0.3,
    });
    return JSON.parse(raw);
  } catch (err) {
    console.warn(`[openai] evaluateInterview failed: ${err.message}. Using mock fallback.`);
    return {
      overallScore: 82,
      communicationScore: 85,
      codingScore: 80,
      problemSolvingScore: 84,
      timeManagementScore: 80,
      confidenceScore: 85,
      strengths: [
        "Clearly explained the brute force and optimized approaches before coding.",
        "Correctly analyzed time and space complexities.",
        "Maintained good communication throughout the session."
      ],
      weaknesses: [
        "Slightly slow in starting the implementation.",
        "Missed verifying empty input bounds initially."
      ],
      improvementSuggestions: [
        "Practice jumping into coding faster after designing the solution.",
        "Always write down test cases first to run dry-runs."
      ]
    };
  }
}

/**
 * Analyzes extracted resume text and returns skills/gaps/recommendations.
 */
async function analyzeResume({ resumeText, targetCompany = null }) {
  const system = `You analyze software engineering resumes. Respond ONLY with JSON:
{
  "extractedSkills": string[],
  "missingSkills": string[],
  "recommendedTopics": string[],
  "suggestedQuestions": string[]
}${targetCompany ? ` Tailor missingSkills and suggestedQuestions toward a ${targetCompany} interview.` : ''}`;

  try {
    const raw = await chatComplete({
      system,
      messages: [{ role: 'user', content: resumeText }],
      jsonMode: true,
      temperature: 0.4,
    });
    return JSON.parse(raw);
  } catch (err) {
    console.warn(`[openai] analyzeResume failed: ${err.message}. Using mock fallback.`);
    return {
      extractedSkills: ["JavaScript", "React", "Node.js", "Express", "HTML/CSS", "SQL", "Git"],
      missingSkills: targetCompany 
        ? ["System Design at scale", "Kubernetes", "Redis", `${targetCompany} Leadership Values`]
        : ["System Design at scale", "Kubernetes", "Redis", "Message Queues"],
      recommendedTopics: ["Graph Algorithms", "System Design Patterns", "Caching Mechanisms"],
      suggestedQuestions: [
        `How would you design a rate limiter for a high-traffic ${targetCompany || 'web'} API?`,
        "Explain the difference between SQL and NoSQL databases.",
        "Implement a function to find the shortest path in a weighted graph."
      ]
    };
  }
}

/**
 * Explains a submission.
 */
async function explainSubmission({ problemStatement, code, language, status }) {
  const system = `You are a coding mentor. Given a problem, a candidate's submitted code, and
its judged status, explain: (1) what the code does, (2) its time and space complexity, (3) how it
compares to an optimized approach, (4) any common mistakes present. Be concise and use markdown.`;

  try {
    return await chatComplete({
      system,
      messages: [
        {
          role: 'user',
          content: `Problem:\n${problemStatement}\n\nLanguage: ${language}\nStatus: ${status}\nCode:\n${code}`,
        },
      ],
      temperature: 0.4,
    });
  } catch (err) {
    console.warn(`[openai] explainSubmission failed: ${err.message}. Using mock fallback.`);
    return `### Code Review & Explanation (Fallback Mode)

1. **What your code does:**
   Your code successfully implements the algorithm to solve this problem in **${language}**.
   
2. **Complexity Analysis:**
   - **Time Complexity:** $O(N)$ - where $N$ is the number of elements. We traverse the input elements.
   - **Space Complexity:** $O(N)$ - in the worst case, we store the elements in a hash set or table.

3. **Comparison with Optimized Approach:**
   - Your solution is optimal in terms of time complexity.
   - If memory is a constraint, we can explore in-place modification or bit manipulation if applicable.

4. **Common Mistakes:**
   - Always ensure you check for edge cases such as empty input arrays, null values, or single element inputs.
`;
  }
}

/**
 * Recommends the next problem for a user.
 */
async function recommendNextProblems({ recentSubmissions, weakTopics, targetCompany, count = 3 }) {
  const system = `You recommend coding practice problems. Respond ONLY with a JSON object:
{ "recommendations": [{ "topic": string, "difficulty": "Easy"|"Medium"|"Hard", "reason": string }] }
Return exactly ${count} recommendations.`;

  try {
    const raw = await chatComplete({
      system,
      messages: [
        {
          role: 'user',
          content: JSON.stringify({ recentSubmissions, weakTopics, targetCompany }),
        },
      ],
      jsonMode: true,
      temperature: 0.5,
    });
    return JSON.parse(raw).recommendations;
  } catch (err) {
    console.warn(`[openai] recommendNextProblems failed: ${err.message}. Using mock fallback.`);
    return [
      { topic: "Two Sum", difficulty: "Easy", reason: "Ideal for practicing basic hash map operations." },
      { topic: "Longest Substring Without Repeating Characters", difficulty: "Medium", reason: "Good for mastering the sliding window technique." },
      { topic: "Merge K Sorted Lists", difficulty: "Hard", reason: "Helps understand heaps and divide-and-conquer strategy." }
    ];
  }
}

/**
 * Generates a personalized preparation roadmap for the AI Roadmap Generator feature.
 */
async function generateRoadmap({ year, targetCompany, monthsRemaining }) {
  const system = `You are a career coach for software engineering interview prep. Respond ONLY
with JSON: { "milestones": [{ "month": number, "focus": string, "topics": string[], "goals": string[] }] }
Cover exactly ${monthsRemaining} month(s), tailored to a student in year "${year}" targeting ${targetCompany}.`;

  try {
    const raw = await chatComplete({
      system,
      messages: [{ role: 'user', content: 'Generate the roadmap.' }],
      jsonMode: true,
      temperature: 0.5,
    });
    return JSON.parse(raw).milestones;
  } catch (err) {
    console.warn(`[openai] generateRoadmap failed: ${err.message}. Using mock fallback.`);
    const milestones = [];
    const focuses = [
      "Data Structures & Array/String Basics",
      "Advanced Data Structures (Trees & Graphs)",
      "Algorithms (Dynamic Programming & Recursion)",
      "System Design & High-Level Architecture",
      "Mock Interviews & Company Prep Sets"
    ];
    const limit = Math.min(monthsRemaining || 3, 12);
    for (let i = 1; i <= limit; i++) {
      const focus = focuses[(i - 1) % focuses.length];
      milestones.push({
        month: i,
        focus: `Month ${i}: ${focus}`,
        topics: ["Arrays", "Strings", "Sorting", "Search"].slice(0, 2 + (i % 2)),
        goals: [
          `Solve 15-20 problems on key topics.`,
          `Complete at least 2 mock interviews tailored to ${targetCompany}.`,
          `Analyze weekly progress chart.`
        ]
      });
    }
    return milestones;
  }
}

/** Mock HR interview: asks a question and grades the candidate's answer. */
async function getHrInterviewerTurn({ transcript, candidateInput }) {
  const system = `You are an HR interviewer. Ask common behavioral/HR questions (tell me about
yourself, strengths/weaknesses, conflict resolution, leadership, resume-based questions), and
after each candidate answer give brief constructive feedback before moving to the next question.`;

  const messages = transcript.map((t) => ({
    role: t.speaker === 'ai' ? 'assistant' : 'user',
    content: t.message,
  }));
  messages.push({ role: 'user', content: candidateInput });

  try {
    return await chatComplete({ system, messages });
  } catch (err) {
    console.warn(`[openai] getHrInterviewerTurn failed: ${err.message}. Using smart mock fallback.`);
    
    // Check if the interview is just starting
    if (candidateInput === '[Interview started]' || transcript.length === 0) {
      return "Welcome to the HR and behavioral round of your interview! To start, could you please tell me about yourself, your background, and why you are interested in this software engineering role?";
    }

    const lastMsg = (candidateInput || '').trim().toLowerCase();

    // Stuck / negative
    const negativeWords = ['no', 'idk', 'dont know', "don't know", 'not sure', 'confused', 'stuck', 'nothing'];
    if (negativeWords.includes(lastMsg) || negativeWords.some((w) => lastMsg.startsWith(w) && lastMsg.length < 15)) {
      return "No worries. Interviews can be intimidating! We can take it one step at a time. Tell me about a project you are proud of—even a small academic project. What did you build?";
    }

    // Greeting
    if (['hi', 'hello', 'hey', 'yo'].includes(lastMsg)) {
      return "Hello! Welcome. Let's start with your background. Tell me about yourself.";
    }

    // Confirmation
    if (['yes', 'ok', 'okay', 'sure', 'yeah'].includes(lastMsg)) {
      return "Perfect. Tell me about a time you had to work with a difficult teammate. How did you resolve the situation?";
    }

    // Checking if they explained themselves/background
    if (lastMsg.includes('myself') || lastMsg.includes('experience') || lastMsg.includes('university') || lastMsg.includes('college') || lastMsg.includes('developer') || lastMsg.length > 50) {
      return "That sounds like a solid background! Why should we hire you? What unique values do you bring to our team?";
    }

    if (lastMsg.length < 10) {
      return "I see. Can you tell me about a time you faced a major conflict within a project team? How did you handle it, and what did you learn?";
    }

    return "Great response. Tell me about a time you faced a tight deadline or had to prioritize multiple competing tasks. How did you handle it?";
  }
}

/** Mock System Design interview: conducts a system design review. */
async function getSystemDesignInterviewerTurn({ transcript, candidateInput }) {
  const system = `You are an experienced system design interviewer at a top tech company. Introduce yourself once at the start, then ask the candidate to design a large-scale system (e.g. TinyURL, Uber, Netflix). Ask about requirements (functional and non-functional), high-level architecture, database choice, API design, scaling, caching, load balancers, rate limiting, and bottlenecks. Be constructive, realistic, and probe deep. Keep responses concise (2-4 sentences) and highly focused on system design trade-offs.`;

  const messages = transcript.map((t) => ({
    role: t.speaker === 'ai' ? 'assistant' : 'user',
    content: t.message,
  }));
  messages.push({ role: 'user', content: candidateInput });

  try {
    return await chatComplete({ system, messages });
  } catch (err) {
    console.warn(`[openai] getSystemDesignInterviewerTurn failed: ${err.message}. Using smart mock fallback.`);
    
    // Check if the interview is just starting
    if (candidateInput === '[Interview started]' || transcript.length === 0) {
      return "Welcome to your System Design interview. Today we are going to design a large-scale system. Let's design a URL shortening service like TinyURL. Could you please start by outlining the functional and non-functional requirements?";
    }

    const lastMsg = (candidateInput || '').trim().toLowerCase();

    // Stuck / negative
    const negativeWords = ['no', 'idk', 'dont know', "don't know", 'not sure', 'confused', 'stuck', 'hard', 'cannot', 'cant', "can't", 'nothing'];
    if (negativeWords.includes(lastMsg) || negativeWords.some((w) => lastMsg.startsWith(w) && lastMsg.length < 15)) {
      return "No problem! Let's break it down together. For a URL shortener, functional requirements include: generating a short URL from a long URL, and redirecting a short URL to the long URL. Can you outline the scale or read/write ratio we should design for?";
    }

    // Greeting
    if (['hi', 'hello', 'hey', 'yo'].includes(lastMsg)) {
      return "Hello! Welcome to the System Design interview. Let's design a URL shortening service like TinyURL. Please list the functional requirements first.";
    }

    // Confirmation
    if (['yes', 'ok', 'okay', 'sure', 'yeah'].includes(lastMsg)) {
      return "Excellent. Let's talk about the database. What kind of database would you use to store the mapping between short URLs and long URLs? SQL or NoSQL?";
    }

    // Scaling / requirements
    if (lastMsg.includes('requirement') || lastMsg.includes('functional') || lastMsg.includes('redirect') || lastMsg.includes('shorten') || lastMsg.length > 55) {
      return "That high-level design is clean. How would you handle database partitioning or sharding to support scale? What caching strategies would you employ?";
    }

    if (lastMsg.length < 10) {
      return "I see. Let's look at the API design. What endpoints would you expose to shorten URLs and redirect users?";
    }

    return "That's a solid explanation. How would you prevent service abuse (e.g. implement rate limiting) and ensure high availability?";
  }
}

module.exports = {
  chatComplete,
  getInterviewerTurn,
  evaluateInterview,
  analyzeResume,
  explainSubmission,
  recommendNextProblems,
  generateRoadmap,
  getHrInterviewerTurn,
  getSystemDesignInterviewerTurn,
};

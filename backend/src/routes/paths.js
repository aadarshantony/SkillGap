import express from 'express';
import LearningPath from '../models/LearningPath.js';
import SkillTest from '../models/SkillTest.js';
import LearnerProfile from '../models/LearnerProfile.js';
import User from '../models/User.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { generateLearningPath, generateSkillTest } from '../services/aiService.js';
import { issueCredential } from '../services/credentialService.js';

const router = express.Router();

// GET /api/paths — learner's active paths
router.get('/', requireAuth, requireRole('learner'), async (req, res) => {
  try {
    const paths = await LearningPath.find({ learnerId: req.userId })
      .sort({ createdAt: -1 })
      .populate('credentialId', 'slug status score issuedAt');
    res.json({ paths });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/paths/:id
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const path = await LearningPath.findOne({ _id: req.params.id, learnerId: req.userId })
      .populate('credentialId');
    if (!path) return res.status(404).json({ error: 'Path not found' });
    res.json({ path });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/paths/generate — generate a path for a skill gap
router.post('/generate', requireAuth, requireRole('learner'), async (req, res) => {
  try {
    const { skillName, currentProficiency, targetProficiency, jobId, jobType, jobTitle, companyName } = req.body;
    if (!skillName || !targetProficiency) {
      return res.status(400).json({ error: 'skillName and targetProficiency required' });
    }

    // Check if a path already exists for this skill
    const existing = await LearningPath.findOne({
      learnerId: req.userId,
      skillName,
      status: 'active',
    });
    if (existing) return res.json({ path: existing, existing: true });

    const jobContext = { jobTitle, companyName };
    const generated = await generateLearningPath(skillName, currentProficiency, targetProficiency, jobContext);

    const path = await LearningPath.create({
      learnerId: req.userId,
      skillName,
      targetProficiency,
      currentProficiency,
      triggeredBy: jobId ? { jobId, jobType, jobTitle, companyName, snapshotDate: new Date() } : undefined,
      steps: (generated.steps || []).map((s, i) => ({ ...s, order: i + 1, completed: false })),
      status: 'active',
    });

    res.status(201).json({ path });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/paths/:id/step/:order — mark a step complete
router.patch('/:id/step/:order', requireAuth, requireRole('learner'), async (req, res) => {
  try {
    const path = await LearningPath.findOne({ _id: req.params.id, learnerId: req.userId });
    if (!path) return res.status(404).json({ error: 'Path not found' });

    const step = path.steps.find(s => s.order === parseInt(req.params.order));
    if (!step) return res.status(404).json({ error: 'Step not found' });
    if (step.type === 'checkpoint') return res.status(400).json({ error: 'Checkpoint must be completed via /checkpoint endpoint' });

    step.completed = true;
    step.completedAt = new Date();
    await path.save();

    res.json({ step, message: 'Step marked complete!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/paths/:id/test — get (or generate) skill test for checkpoint
router.get('/:id/test', requireAuth, requireRole('learner'), async (req, res) => {
  try {
    const path = await LearningPath.findOne({ _id: req.params.id, learnerId: req.userId });
    if (!path) return res.status(404).json({ error: 'Path not found' });

    const cacheKey = `${path.skillName.toLowerCase().replace(/\s+/g, '_')}_${path.targetProficiency}`;

    // Try to find cached test
    let test = await SkillTest.findOne({ cacheKey });

    if (!test) {
      // Generate test via AI
      const generated = await generateSkillTest(path.skillName, path.targetProficiency);
      test = await SkillTest.create({
        skillName: path.skillName,
        proficiencyLevel: path.targetProficiency,
        questions: generated.questions || [],
        cacheKey,
        aiGenerated: true,
      });
    }

    // Return questions without correct answers (security)
    const safeQuestions = test.questions.map((q, i) => ({
      index: i,
      text: q.text,
      options: q.options,
      difficulty: q.difficulty,
    }));

    res.json({ test: { id: test._id, skillName: test.skillName, proficiencyLevel: test.proficiencyLevel, timeLimit: test.timeLimit, passingScore: test.passingScore, questions: safeQuestions } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/paths/:id/checkpoint — submit test answers + issue credential
router.post('/:id/checkpoint', requireAuth, requireRole('learner'), async (req, res) => {
  try {
    const { answers, timeTakenMinutes } = req.body; // answers: [{questionIndex, selectedOption}]
    const path = await LearningPath.findOne({ _id: req.params.id, learnerId: req.userId });
    if (!path) return res.status(404).json({ error: 'Path not found' });
    if (path.status === 'completed') return res.status(400).json({ error: 'Path already completed' });

    const cacheKey = `${path.skillName.toLowerCase().replace(/\s+/g, '_')}_${path.targetProficiency}`;
    const test = await SkillTest.findOne({ cacheKey });
    if (!test || !test.questions.length) {
      return res.status(400).json({ error: 'No test found for this path. Generate test first.' });
    }

    // Grade answers
    let correct = 0;
    for (const answer of answers) {
      const q = test.questions[answer.questionIndex];
      if (q && answer.selectedOption === q.correctIndex) correct++;
    }

    const score = Math.round((correct / test.questions.length) * 100);
    const passed = score >= test.passingScore;

    if (!passed) {
      return res.json({
        passed: false,
        score,
        passingScore: test.passingScore,
        message: `You scored ${score}%. You need ${test.passingScore}% to pass. Keep studying and try again!`,
        correctAnswers: correct,
        totalQuestions: test.questions.length,
      });
    }

    // Issue credential
    const user = await User.findById(req.userId);
    const credential = await issueCredential({
      learnerId: req.userId,
      learnerName: user.name,
      skillId: null,
      skillName: path.skillName,
      proficiencyLevel: path.targetProficiency,
      score,
      passingScore: test.passingScore,
      pathId: path._id,
      anchoredTo: path.triggeredBy
        ? {
            jobId: path.triggeredBy.jobId,
            jobType: path.triggeredBy.jobType,
            jobTitle: path.triggeredBy.jobTitle,
            companyName: path.triggeredBy.companyName,
            requirementSnapshot: path.triggeredBy,
            snapshotDate: path.triggeredBy.snapshotDate,
          }
        : undefined,
      testDetails: {
        testId: test._id,
        questionsAnswered: answers.length,
        correctAnswers: correct,
        timeTakenMinutes: timeTakenMinutes || 0,
        completedAt: new Date(),
      },
    });

    // Mark all steps complete
    path.steps.forEach(s => { s.completed = true; s.completedAt = new Date(); });
    await path.save();

    res.json({
      passed: true,
      score,
      passingScore: test.passingScore,
      correctAnswers: correct,
      totalQuestions: test.questions.length,
      credential: { id: credential._id, slug: credential.slug, skillName: credential.skillName },
      verifyUrl: `/verify/${credential.slug}`,
      message: `🎉 Congratulations! You passed with ${score}%. Your ${path.skillName} credential has been issued.`,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

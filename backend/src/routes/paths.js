import express from 'express';
import LearningPath from '../models/LearningPath.js';
import SkillTest from '../models/SkillTest.js';
import LearnerProfile from '../models/LearnerProfile.js';
import Application from '../models/Application.js';
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
      skillName: new RegExp(`^${skillName.trim()}$`, 'i'),
      status: 'active',
    });
    if (existing) return res.json({ path: existing, existing: true });

    const jobContext = { jobTitle, companyName };
    const generated = await generateLearningPath(skillName, currentProficiency, targetProficiency, jobContext);

    const path = await LearningPath.create({
      learnerId: req.userId,
      skillName: skillName.trim(),
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
    if (step.type === 'checkpoint') return res.status(400).json({ error: 'Checkpoint must be completed via assessment' });

    step.completed = true;
    step.completedAt = new Date();
    await path.save();

    res.json({ step, message: 'Step marked complete!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/paths/:id/test — get skill test with custom question count & fresh toggle
router.get('/:id/test', requireAuth, requireRole('learner'), async (req, res) => {
  try {
    const path = await LearningPath.findOne({ _id: req.params.id, learnerId: req.userId });
    if (!path) return res.status(404).json({ error: 'Path not found' });

    const fresh = req.query.fresh === 'true';
    const count = parseInt(req.query.count) || 8;

    const cacheKey = `${path.skillName.toLowerCase().replace(/\s+/g, '_')}_${path.targetProficiency}_q${count}`;

    let test;
    if (!fresh) {
      test = await SkillTest.findOne({ cacheKey });
    }

    if (!test) {
      const generated = await generateSkillTest(path.skillName, path.targetProficiency, count);
      const uniqueKey = fresh ? `${cacheKey}_${Date.now()}` : cacheKey;
      test = await SkillTest.create({
        skillName: path.skillName,
        proficiencyLevel: path.targetProficiency,
        questions: generated.questions || [],
        cacheKey: uniqueKey,
        aiGenerated: true,
      });
    }

    const safeQuestions = (test.questions || []).map((q, i) => ({
      index: i,
      text: q.text,
      options: q.options,
      difficulty: q.difficulty,
    }));

    res.json({
      test: {
        id: test._id,
        skillName: test.skillName,
        proficiencyLevel: test.proficiencyLevel,
        timeLimit: Math.max(10, Math.ceil((safeQuestions.length * 2.5))),
        passingScore: 70,
        questions: safeQuestions,
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/paths/:id/checkpoint — submit test answers + issue credential + update application
router.post('/:id/checkpoint', requireAuth, requireRole('learner'), async (req, res) => {
  try {
    const { answers, timeTakenMinutes, testId } = req.body;
    const path = await LearningPath.findOne({ _id: req.params.id, learnerId: req.userId });
    if (!path) return res.status(404).json({ error: 'Path not found' });
    if (path.status === 'completed') return res.status(400).json({ error: 'Path already completed' });

    let test;
    if (testId) {
      test = await SkillTest.findById(testId);
    } else {
      const cacheKey = `${path.skillName.toLowerCase().replace(/\s+/g, '_')}_${path.targetProficiency}`;
      test = await SkillTest.findOne({ cacheKey });
    }

    if (!test || !test.questions?.length) {
      return res.status(400).json({ error: 'No test found. Please load the assessment first.' });
    }

    // Grade answers
    let correct = 0;
    for (const answer of answers) {
      const q = test.questions[answer.questionIndex];
      if (q && answer.selectedOption === q.correctIndex) correct++;
    }

    const score = Math.round((correct / test.questions.length) * 100);
    const passed = score >= (test.passingScore || 70);

    if (!passed) {
      return res.json({
        passed: false,
        score,
        passingScore: test.passingScore || 70,
        message: `You scored ${score}%. You need ${test.passingScore || 70}% to pass. Review the materials and retry!`,
        correctAnswers: correct,
        totalQuestions: test.questions.length,
        canRetry: true,
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
      passingScore: test.passingScore || 70,
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

    // Mark path completed
    path.steps.forEach(s => { s.completed = true; s.completedAt = new Date(); });
    path.status = 'completed';
    path.credentialId = credential._id;
    await path.save();

    // Update learner profile: mark skill verified & updated proficiency
    let profile = await LearnerProfile.findOne({ userId: req.userId });
    if (profile) {
      const existingSkill = profile.skills.find(s => s.skillName.toLowerCase() === path.skillName.toLowerCase());
      if (existingSkill) {
        existingSkill.verified = true;
        existingSkill.proficiency = path.targetProficiency;
        existingSkill.source = 'test';
      } else {
        profile.skills.push({
          skillName: path.skillName,
          proficiency: path.targetProficiency,
          verified: true,
          source: 'test',
        });
      }
      await profile.save();
    }

    // Update all pending applications for this learner waiting on this skill test
    const skillRegex = new RegExp(`^${path.skillName.trim()}$`, 'i');
    await Application.updateMany(
      {
        learnerId: req.userId,
        status: 'pending_test',
        $or: [
          { 'triggeredTest.skillName': skillRegex },
          ...(path.triggeredBy?.jobId ? [{ jobId: path.triggeredBy.jobId }] : [])
        ]
      },
      {
        $set: {
          status: 'submitted',
          submittedAt: new Date(),
          'triggeredTest.passed': true,
          'triggeredTest.score': score,
        }
      }
    );

    res.json({
      passed: true,
      score,
      passingScore: test.passingScore || 70,
      correctAnswers: correct,
      totalQuestions: test.questions.length,
      credential: { id: credential._id, slug: credential.slug, skillName: credential.skillName },
      verifyUrl: `/verify/${credential.slug}`,
      message: `🎉 Congratulations! You passed with ${score}%. Your ${path.skillName} verified badge has been issued!`,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

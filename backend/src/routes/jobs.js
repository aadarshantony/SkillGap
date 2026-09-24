import express from 'express';
import JobEmployer from '../models/JobEmployer.js';
import JobPublic from '../models/JobPublic.js';
import Application from '../models/Application.js';
import LearnerProfile from '../models/LearnerProfile.js';
import User from '../models/User.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { extractJobSkills } from '../services/aiService.js';
import { fetchAdzunaJobs, normalizeAndCache } from '../services/adzunaService.js';

const router = express.Router();

// ─── Employer: post a job ────────────────────────────────────────────────────
router.post('/', requireAuth, requireRole('employer'), async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const { title, description, location, remote, industry, jobType, requirements, salaryMin, salaryMax } = req.body;
    if (!title || !description) return res.status(400).json({ error: 'title and description required' });

    let resolvedRequirements = requirements || [];

    // If no requirements provided, extract from description using AI
    if (!resolvedRequirements.length && description.length > 50) {
      try {
        const extracted = await extractJobSkills(description);
        resolvedRequirements = extracted.skills || [];
      } catch { /* AI optional */ }
    }

    const job = await JobEmployer.create({
      employerId: req.userId,
      companyName: req.body.companyName || user.name,
      title, description, location, remote, industry, jobType,
      requirements: resolvedRequirements, salaryMin, salaryMax,
    });

    res.status(201).json({ job });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Employer jobs list ──────────────────────────────────────────────────────
router.get('/employer', requireAuth, async (req, res) => {
  try {
    const { industry, location, skills, showAll } = req.query;
    let query = { active: true };
    if (industry) query.industry = industry;
    if (location) query.location = new RegExp(location, 'i');

    let jobs = await JobEmployer.find(query).sort({ createdAt: -1 }).limit(50);

    // If learner and not showAll, filter by learner's skills
    const user = await User.findById(req.userId);
    if (user.role === 'learner' && showAll !== 'true') {
      const profile = await LearnerProfile.findOne({ userId: req.userId });
      if (profile?.skills?.length) {
        const learnerSkills = profile.skills.map(s => s.skillName.toLowerCase());
        jobs = jobs.filter(j =>
          j.requirements.some(r => learnerSkills.includes(r.skillName.toLowerCase()))
        );
      }
    }

    res.json({ jobs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Public jobs (Adzuna cached) ─────────────────────────────────────────────
router.get('/public', requireAuth, async (req, res) => {
  try {
    const { keywords, location, refresh } = req.query;

    // Optionally refresh from Adzuna
    if (refresh === 'true') {
      const { results } = await fetchAdzunaJobs({ keywords, location });
      await normalizeAndCache(results);
    }

    const query = {};
    if (keywords) query.$or = [
      { title: new RegExp(keywords, 'i') },
      { description: new RegExp(keywords, 'i') },
    ];
    if (location) query.location = new RegExp(location, 'i');

    const jobs = await JobPublic.find(query).sort({ fetchedAt: -1 }).limit(50);
    res.json({ jobs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Get single job ──────────────────────────────────────────────────────────
router.get('/:type/:id', requireAuth, async (req, res) => {
  try {
    const { type, id } = req.params;
    const job = type === 'public'
      ? await JobPublic.findById(id)
      : await JobEmployer.findById(id).populate('requirements.skillId', 'name category');
    if (!job) return res.status(404).json({ error: 'Job not found' });
    res.json({ job });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Apply to a job ──────────────────────────────────────────────────────────
router.post('/:type/:id/apply', requireAuth, requireRole('learner'), async (req, res) => {
  try {
    const { type, id } = req.params;
    const existing = await Application.findOne({ learnerId: req.userId, jobId: id });
    if (existing) return res.status(409).json({ error: 'Already applied' });

    const job = type === 'public'
      ? await JobPublic.findById(id)
      : await JobEmployer.findById(id);
    if (!job) return res.status(404).json({ error: 'Job not found' });

    // Compute match score
    const profile = await LearnerProfile.findOne({ userId: req.userId });
    const learnerSkills = new Set((profile?.skills || []).map(s => s.skillName.toLowerCase()));
    const jobRequirements = type === 'employer'
      ? job.requirements.filter(r => r.required)
      : job.extractedSkills.filter(r => r.required);

    const matched = jobRequirements.filter(r => learnerSkills.has(r.skillName.toLowerCase())).length;
    const matchScore = jobRequirements.length ? Math.round((matched / jobRequirements.length) * 100) : 50;

    // Find unverified required skills to trigger a test
    const unverifiedRequired = type === 'employer'
      ? job.requirements.filter(r => r.required && !profile?.skills.find(s => s.skillName.toLowerCase() === r.skillName.toLowerCase() && s.verified))
      : [];

    const triggersTest = unverifiedRequired.length > 0;
    const triggerSkill = unverifiedRequired[0];

    const app = await Application.create({
      learnerId: req.userId,
      jobId: id,
      jobType: type,
      jobTitle: job.title,
      companyName: job.company || job.companyName,
      status: triggersTest ? 'pending_test' : 'submitted',
      matchScore,
      triggeredTest: triggerSkill ? { skillName: triggerSkill.skillName } : undefined,
      submittedAt: triggersTest ? undefined : new Date(),
    });

    res.status(201).json({
      application: app,
      triggerTest: triggersTest ? { skillName: triggerSkill?.skillName } : null,
      message: triggersTest
        ? `To complete your application, prove your ${triggerSkill?.skillName} skills with a quick assessment.`
        : 'Application submitted successfully!',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

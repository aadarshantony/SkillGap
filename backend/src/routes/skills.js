import express from 'express';
import SkillTaxonomy from '../models/SkillTaxonomy.js';
import LearnerProfile from '../models/LearnerProfile.js';
import JobEmployer from '../models/JobEmployer.js';
import JobPublic from '../models/JobPublic.js';
import SkillDemandDaily from '../models/SkillDemandDaily.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// GET /api/skills/taxonomy
router.get('/taxonomy', async (req, res) => {
  try {
    const skills = await SkillTaxonomy.find({}).sort({ name: 1 });
    res.json({ skills });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/skills/gap — learner's personal skill gap (ranked)
router.get('/gap', requireAuth, async (req, res) => {
  try {
    const profile = await LearnerProfile.findOne({ userId: req.userId });
    if (!profile) return res.json({ gaps: [] });

    const learnerSkills = new Map();
    for (const s of profile.skills) {
      learnerSkills.set(s.skillName.toLowerCase(), s);
    }

    // Aggregate all required skills from employer jobs
    const jobs = await JobEmployer.find({ active: true });
    const skillDemand = new Map(); // skillName -> { count, proficiencies, jobs }

    for (const job of jobs) {
      for (const req of job.requirements) {
        const key = req.skillName.toLowerCase();
        if (!skillDemand.has(key)) {
          skillDemand.set(key, { skillName: req.skillName, count: 0, requiredProficiency: req.proficiency, jobs: [] });
        }
        const entry = skillDemand.get(key);
        entry.count++;
        entry.jobs.push({ jobId: job._id, title: job.title, company: job.companyName });
      }
    }

    // Get recent demand data
    const recentDemand = await SkillDemandDaily.aggregate([
      { $match: { date: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } },
      { $group: { _id: '$skillName', totalCount: { $sum: '$count' }, avgCount: { $avg: '$count' } } },
    ]);
    const demandMap = new Map(recentDemand.map(d => [d._id.toLowerCase(), d]));

    const PROFICIENCY_RANK = { beginner: 1, intermediate: 2, advanced: 3, expert: 4 };

    const gaps = [];
    for (const [key, demand] of skillDemand) {
      const learnerSkill = learnerSkills.get(key);
      const requiredRank = PROFICIENCY_RANK[demand.requiredProficiency] || 2;
      const learnerRank = PROFICIENCY_RANK[learnerSkill?.proficiency] || 0;
      const isGap = !learnerSkill || learnerRank < requiredRank;
      const isUnverified = learnerSkill && !learnerSkill.verified;

      if (isGap || isUnverified) {
        const mktDemand = demandMap.get(key);
        gaps.push({
          skillName: demand.skillName,
          currentProficiency: learnerSkill?.proficiency || null,
          requiredProficiency: demand.requiredProficiency,
          verified: learnerSkill?.verified || false,
          jobCount: demand.count,
          marketDemand7d: mktDemand?.totalCount || 0,
          sampleJobs: demand.jobs.slice(0, 3),
          gapType: !learnerSkill ? 'missing' : (learnerRank < requiredRank ? 'insufficient' : 'unverified'),
        });
      }
    }

    // Sort by open job count and market demand (opportunity score)
    gaps.sort((a, b) => (b.jobCount * 1000 + b.marketDemand7d) - (a.jobCount * 1000 + a.marketDemand7d));

    res.json({ gaps: gaps.slice(0, 20) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/skills/demand — market pulse data for charts
router.get('/demand', async (req, res) => {
  try {
    const { days = 30, skills: skillsParam } = req.query;
    const since = new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000);

    const matchQuery = { date: { $gte: since } };
    if (skillsParam) {
      const skillList = skillsParam.split(',').map(s => s.trim());
      matchQuery.skillName = { $in: skillList };
    }

    const data = await SkillDemandDaily.find(matchQuery).sort({ skillName: 1, date: 1 });
    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

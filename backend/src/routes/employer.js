import express from 'express';
import JobEmployer from '../models/JobEmployer.js';
import LearnerProfile from '../models/LearnerProfile.js';
import User from '../models/User.js';
import Credential from '../models/Credential.js';
import Application from '../models/Application.js';
import SkillDemandDaily from '../models/SkillDemandDaily.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = express.Router();

const PROFICIENCY_RANK = { beginner: 1, intermediate: 2, advanced: 3, expert: 4 };

function computeMatchScore(learnerSkills, jobRequirements) {
  if (!jobRequirements.length) return 50;
  const learnerMap = new Map(learnerSkills.map(s => [s.skillName.toLowerCase(), s]));
  let totalScore = 0;
  let totalWeight = 0;
  for (const req of jobRequirements) {
    const weight = req.required ? 2 : 1;
    const learnerSkill = learnerMap.get(req.skillName.toLowerCase());
    let score = 0;
    if (learnerSkill) {
      const learnerRank = PROFICIENCY_RANK[learnerSkill.proficiency] || 0;
      const requiredRank = PROFICIENCY_RANK[req.proficiency] || 2;
      score = Math.min(1, learnerRank / requiredRank);
      if (learnerSkill.verified) score = Math.min(score * 1.2, 1); // bonus for verified
    }
    totalScore += score * weight;
    totalWeight += weight;
  }
  return Math.round((totalScore / totalWeight) * 100);
}

// GET /api/employer/jobs — employer's own job listings
router.get('/jobs', requireAuth, requireRole('employer'), async (req, res) => {
  try {
    const jobs = await JobEmployer.find({ employerId: req.userId }).sort({ createdAt: -1 });
    res.json({ jobs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/employer/candidates — ranked matched candidates for employer's jobs
router.get('/candidates', requireAuth, requireRole('employer'), async (req, res) => {
  try {
    const { jobId, minScore = 0 } = req.query;

    // Get employer's jobs
    const jobQuery = { employerId: req.userId, active: true };
    if (jobId) jobQuery._id = jobId;
    const jobs = await JobEmployer.find(jobQuery);

    // Get all learner profiles
    const profiles = await LearnerProfile.find({ profileComplete: true });
    const userIds = profiles.map(p => p.userId);
    const users = await User.find({ _id: { $in: userIds }, role: 'learner' }).select('name email');
    const userMap = new Map(users.map(u => [u._id.toString(), u]));

    // Get all credentials for these learners
    const allCreds = await Credential.find({ learnerId: { $in: userIds }, status: 'active' });
    const credsByLearner = new Map();
    for (const c of allCreds) {
      const key = c.learnerId.toString();
      if (!credsByLearner.has(key)) credsByLearner.set(key, []);
      credsByLearner.get(key).push(c);
    }

    const candidates = [];
    for (const profile of profiles) {
      const user = userMap.get(profile.userId.toString());
      if (!user) continue;

      const learnerCreds = credsByLearner.get(profile.userId.toString()) || [];
      const candidateJobs = [];

      for (const job of jobs) {
        const matchScore = computeMatchScore(profile.skills, job.requirements);
        if (matchScore < parseInt(minScore)) continue;

        // Which of this learner's credentials are verified for this job's requirements?
        const matchedCreds = job.requirements
          .filter(r => r.required)
          .map(r => {
            const cred = learnerCreds.find(c => c.skillName.toLowerCase() === r.skillName.toLowerCase());
            return cred ? {
              skillName: r.skillName,
              credentialSlug: cred.slug,
              proficiencyLevel: cred.proficiencyLevel,
              score: cred.score,
              issuedAt: cred.issuedAt,
              status: cred.status,
              anchoredJobTitle: cred.anchoredTo?.jobTitle,
            } : null;
          })
          .filter(Boolean);

        candidateJobs.push({
          jobId: job._id,
          jobTitle: job.title,
          matchScore,
          verifiedSkills: matchedCreds,
        });
      }

      if (candidateJobs.length > 0) {
        const bestMatch = Math.max(...candidateJobs.map(j => j.matchScore));
        candidates.push({
          userId: profile.userId,
          name: user.name,
          email: user.email,
          headline: profile.headline,
          location: profile.location,
          industry: profile.industry,
          skills: profile.skills,
          credentials: learnerCreds.map(c => ({ slug: c.slug, skillName: c.skillName, proficiencyLevel: c.proficiencyLevel, status: c.status, issuedAt: c.issuedAt })),
          bestMatchScore: bestMatch,
          jobMatches: candidateJobs,
        });
      }
    }

    candidates.sort((a, b) => b.bestMatchScore - a.bestMatchScore);
    res.json({ candidates });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/employer/candidates/:userId — candidate detail + full verification trail
router.get('/candidates/:userId', requireAuth, requireRole('employer'), async (req, res) => {
  try {
    const profile = await LearnerProfile.findOne({ userId: req.params.userId });
    const user = await User.findById(req.params.userId).select('name email');
    if (!profile || !user) return res.status(404).json({ error: 'Candidate not found' });

    const credentials = await Credential.find({ learnerId: req.params.userId });

    res.json({
      candidate: {
        userId: profile.userId,
        name: user.name,
        email: user.email,
        headline: profile.headline,
        location: profile.location,
        industry: profile.industry,
        education: profile.education,
        workHistory: profile.workHistory,
        skills: profile.skills,
        credentials: credentials.map(c => ({
          slug: c.slug,
          skillName: c.skillName,
          proficiencyLevel: c.proficiencyLevel,
          score: c.score,
          passingScore: c.passingScore,
          status: c.status,
          issuedAt: c.issuedAt,
          expiresAt: c.expiresAt,
          marketDriftFlag: c.marketDriftFlag,
          anchoredTo: c.anchoredTo,
          testDetails: c.testDetails,
          verifyUrl: `/verify/${c.slug}`,
        })),
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/employer/heatmap — skill gap heatmap for employer's active jobs
router.get('/heatmap', requireAuth, requireRole('employer'), async (req, res) => {
  try {
    const { jobId } = req.query;
    const jobQuery = { employerId: req.userId, active: true };
    if (jobId) jobQuery._id = jobId;
    const jobs = await JobEmployer.find(jobQuery);

    const profiles = await LearnerProfile.find({ profileComplete: true });
    const skillStats = new Map();

    for (const job of jobs) {
      for (const req of job.requirements) {
        const key = req.skillName.toLowerCase();
        if (!skillStats.has(key)) {
          skillStats.set(key, {
            skillName: req.skillName,
            jobCount: 0,
            candidatesWithSkill: 0,
            candidatesVerified: 0,
            total: profiles.length,
          });
        }
        const stat = skillStats.get(key);
        stat.jobCount++;

        for (const profile of profiles) {
          const has = profile.skills.find(s => s.skillName.toLowerCase() === key);
          if (has) {
            stat.candidatesWithSkill++;
            if (has.verified) stat.candidatesVerified++;
          }
        }
      }
    }

    const heatmap = Array.from(skillStats.values()).map(s => ({
      ...s,
      supplyRate: s.total > 0 ? Math.round((s.candidatesWithSkill / s.total) * 100) : 0,
      verifiedRate: s.candidatesWithSkill > 0 ? Math.round((s.candidatesVerified / s.candidatesWithSkill) * 100) : 0,
      scarcity: s.total > 0 ? 100 - Math.round((s.candidatesWithSkill / s.total) * 100) : 100,
    }));

    heatmap.sort((a, b) => b.scarcity - a.scarcity);
    res.json({ heatmap });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

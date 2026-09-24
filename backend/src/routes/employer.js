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
      if (learnerSkill.verified) score = Math.min(score * 1.2, 1);
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

    // Attach applicant count to each job
    const jobIds = jobs.map(j => j._id);
    const appCounts = await Application.aggregate([
      { $match: { jobId: { $in: jobIds.map(id => id.toString()) }, jobType: 'employer' } },
      { $group: { _id: '$jobId', count: { $sum: 1 } } },
    ]);
    const countMap = new Map(appCounts.map(a => [a._id, a.count]));

    const enriched = jobs.map(j => ({
      ...j.toObject(),
      applicantCount: countMap.get(j._id.toString()) || 0,
    }));

    res.json({ jobs: enriched });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/employer/applicants/:jobId — people who actually applied for this specific job
router.get('/applicants/:jobId', requireAuth, requireRole('employer'), async (req, res) => {
  try {
    const { jobId } = req.params;

    // Verify this job belongs to the employer
    const job = await JobEmployer.findOne({ _id: jobId, employerId: req.userId });
    if (!job) return res.status(404).json({ error: 'Job not found' });

    // Get all applications for this job
    const applications = await Application.find({ jobId, jobType: 'employer' }).sort({ submittedAt: -1, createdAt: -1 });

    if (applications.length === 0) {
      return res.json({ job, applicants: [] });
    }

    const learnerIds = applications.map(a => a.learnerId);
    const profiles = await LearnerProfile.find({ userId: { $in: learnerIds } });
    const users = await User.find({ _id: { $in: learnerIds }, role: 'learner' }).select('name email');
    const credentials = await Credential.find({ learnerId: { $in: learnerIds }, status: 'active' });

    const profileMap = new Map(profiles.map(p => [p.userId.toString(), p]));
    const userMap = new Map(users.map(u => [u._id.toString(), u]));
    const credsByLearner = new Map();
    for (const c of credentials) {
      const key = c.learnerId.toString();
      if (!credsByLearner.has(key)) credsByLearner.set(key, []);
      credsByLearner.get(key).push(c);
    }

    const applicants = applications.map(app => {
      const profile = profileMap.get(app.learnerId.toString());
      const user = userMap.get(app.learnerId.toString());
      const creds = credsByLearner.get(app.learnerId.toString()) || [];

      const matchScore = profile ? computeMatchScore(profile.skills || [], job.requirements || []) : 0;

      // Which required skills does this applicant have verified?
      const verifiedSkills = job.requirements
        .filter(r => r.required)
        .map(r => {
          const cred = creds.find(c => c.skillName.toLowerCase() === r.skillName.toLowerCase());
          return cred ? {
            skillName: r.skillName,
            credentialSlug: cred.slug,
            proficiencyLevel: cred.proficiencyLevel,
            score: cred.score,
            issuedAt: cred.issuedAt,
            status: cred.status,
          } : null;
        })
        .filter(Boolean);

      return {
        applicationId: app._id,
        status: app.status,
        matchScore,
        submittedAt: app.submittedAt || app.createdAt,
        userId: app.learnerId,
        name: user?.name || 'Unknown',
        email: user?.email || '',
        headline: profile?.headline || '',
        location: profile?.location || '',
        industry: profile?.industry || '',
        skills: profile?.skills || [],
        credentials: creds.map(c => ({
          slug: c.slug,
          skillName: c.skillName,
          proficiencyLevel: c.proficiencyLevel,
          score: c.score,
          status: c.status,
          issuedAt: c.issuedAt,
          verifyUrl: `/verify/${c.slug}`,
        })),
        verifiedSkills,
      };
    }).sort((a, b) => b.matchScore - a.matchScore);

    res.json({ job, applicants });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/employer/applicants/:jobId/candidate/:userId — full candidate detail
router.get('/applicants/:jobId/candidate/:userId', requireAuth, requireRole('employer'), async (req, res) => {
  try {
    const job = await JobEmployer.findOne({ _id: req.params.jobId, employerId: req.userId });
    if (!job) return res.status(404).json({ error: 'Job not found' });

    const profile = await LearnerProfile.findOne({ userId: req.params.userId });
    const user = await User.findById(req.params.userId).select('name email');
    if (!profile || !user) return res.status(404).json({ error: 'Candidate not found' });

    const credentials = await Credential.find({ learnerId: req.params.userId });
    const application = await Application.findOne({ learnerId: req.params.userId, jobId: req.params.jobId });

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
        applicationStatus: application?.status,
        matchScore: computeMatchScore(profile.skills || [], job.requirements || []),
        credentials: credentials.map(c => ({
          slug: c.slug,
          skillName: c.skillName,
          proficiencyLevel: c.proficiencyLevel,
          score: c.score,
          passingScore: c.passingScore,
          status: c.status,
          issuedAt: c.issuedAt,
          expiresAt: c.expiresAt,
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

// GET /api/employer/analytics — job + application stats for employer dashboard
router.get('/analytics', requireAuth, requireRole('employer'), async (req, res) => {
  try {
    const jobs = await JobEmployer.find({ employerId: req.userId });
    const jobIds = jobs.map(j => j._id.toString());

    const applications = await Application.find({ jobId: { $in: jobIds }, jobType: 'employer' });

    const totalApps = applications.length;
    const submitted = applications.filter(a => a.status === 'submitted').length;
    const pendingTest = applications.filter(a => a.status === 'pending_test').length;
    const avgMatchScore = applications.length > 0
      ? Math.round(applications.reduce((sum, a) => sum + (a.matchScore || 0), 0) / applications.length)
      : 0;

    // Per-job breakdown
    const perJob = jobs.map(j => {
      const jobApps = applications.filter(a => a.jobId === j._id.toString());
      return {
        jobId: j._id,
        jobTitle: j.title,
        active: j.active,
        applicants: jobApps.length,
        avgScore: jobApps.length > 0
          ? Math.round(jobApps.reduce((s, a) => s + (a.matchScore || 0), 0) / jobApps.length)
          : 0,
        topScore: jobApps.length > 0 ? Math.max(...jobApps.map(a => a.matchScore || 0)) : 0,
      };
    });

    // Skill demand for employer's industries
    const industries = [...new Set(jobs.map(j => j.industry).filter(Boolean))];
    const topSkills = await SkillDemandDaily.aggregate([
      {
        $group: {
          _id: '$skillName',
          avgCount: { $avg: '$count' },
          latestCount: { $last: '$count' },
        }
      },
      { $sort: { avgCount: -1 } },
      { $limit: 10 },
    ]);

    res.json({
      summary: {
        totalJobs: jobs.length,
        activeJobs: jobs.filter(j => j.active).length,
        totalApplicants: totalApps,
        submitted,
        pendingTest,
        avgMatchScore,
      },
      perJob,
      topDemandSkills: topSkills.map(s => ({ skillName: s._id, avgCount: Math.round(s.avgCount) })),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/employer/talent — search talent pool across all industries
router.get('/talent', requireAuth, requireRole('employer'), async (req, res) => {
  try {
    const { skill, industry, query } = req.query;
    let match = {};
    if (industry) match.industry = industry;
    if (query) {
      match.$or = [
        { headline: new RegExp(query, 'i') },
        { location: new RegExp(query, 'i') },
        { 'skills.skillName': new RegExp(query, 'i') }
      ];
    }
    if (skill) {
      match['skills.skillName'] = new RegExp(skill, 'i');
    }

    const profiles = await LearnerProfile.find(match).limit(40);
    const userIds = profiles.map(p => p.userId);
    const users = await User.find({ _id: { $in: userIds } }).select('name email');
    const credentials = await Credential.find({ learnerId: { $in: userIds }, status: 'active' });

    const userMap = new Map(users.map(u => [u._id.toString(), u]));
    const credMap = new Map();
    for (const c of credentials) {
      const k = c.learnerId.toString();
      if (!credMap.has(k)) credMap.set(k, []);
      credMap.get(k).push(c);
    }

    const talent = profiles.map(p => {
      const u = userMap.get(p.userId.toString());
      const creds = credMap.get(p.userId.toString()) || [];
      return {
        userId: p.userId,
        name: u?.name || 'Verified Talent',
        email: u?.email || '',
        headline: p.headline,
        location: p.location,
        industry: p.industry,
        skills: p.skills,
        verifiedSkillsCount: (p.skills || []).filter(s => s.verified).length,
        credentialsCount: creds.length,
        credentials: creds.map(c => ({
          slug: c.slug,
          skillName: c.skillName,
          proficiencyLevel: c.proficiencyLevel,
          score: c.score,
          verifyUrl: `/verify/${c.slug}`
        }))
      };
    });

    res.json({ talent });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

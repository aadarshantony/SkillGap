import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import LearnerProfile from '../models/LearnerProfile.js';
import EmployerProfile from '../models/EmployerProfile.js';
import User from '../models/User.js';
import SkillTaxonomy from '../models/SkillTaxonomy.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { parseResume } from '../services/aiService.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router = express.Router();

import { getLearnerRoleRecommendations } from '../services/recommendationService.js';

// GET /api/profile/recommendations — dynamic daily role recommendations for learner
router.get('/recommendations', requireAuth, requireRole('learner'), async (req, res) => {
  try {
    const recommendations = await getLearnerRoleRecommendations(req.userId);
    res.json(recommendations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/profile — get own profile
router.get('/', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-passwordHash');
    let profile;
    if (user.role === 'learner') {
      profile = await LearnerProfile.findOne({ userId: req.userId });
    } else {
      profile = await EmployerProfile.findOne({ userId: req.userId });
    }
    res.json({ user, profile });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/profile — update learner profile (after review)
router.put('/', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (user.role === 'learner') {
      const update = {
        ...req.body,
        reviewedAt: new Date(),
        profileComplete: true,
        updatedAt: new Date(),
      };
      const profile = await LearnerProfile.findOneAndUpdate(
        { userId: req.userId },
        update,
        { new: true, upsert: true }
      );
      return res.json({ profile });
    } else {
      const profile = await EmployerProfile.findOneAndUpdate(
        { userId: req.userId },
        req.body,
        { new: true }
      );
      return res.json({ profile });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/profile/resume — upload + AI parse resume
router.post('/resume', requireAuth, requireRole('learner'), async (req, res) => {
  try {
    if (!req.files || !req.files.resume) {
      return res.status(400).json({ error: 'No resume file uploaded' });
    }

    const file = req.files.resume;
    const ext = path.extname(file.name).toLowerCase();

    if (!['.pdf', '.doc', '.docx', '.txt'].includes(ext)) {
      return res.status(400).json({ error: 'Supported formats: PDF, DOC, DOCX, TXT' });
    }

    let resumeText = '';
    if (ext === '.txt') {
      resumeText = file.data.toString('utf-8');
    } else if (ext === '.pdf') {
      // Dynamic import to handle optional dependency
      try {
        const pdfParse = (await import('pdf-parse')).default;
        const parsed = await pdfParse(file.data);
        resumeText = parsed.text;
      } catch {
        resumeText = file.data.toString('utf-8', 0, 2000);
      }
    } else if (ext === '.docx') {
      try {
        const mammoth = (await import('mammoth')).default;
        const result = await mammoth.extractRawText({ buffer: file.data });
        resumeText = result.value;
      } catch {
        resumeText = file.data.toString('utf-8', 0, 2000);
      }
    }

    // AI parse
    const parsed = await parseResume(resumeText);

    // Resolve skills against taxonomy
    const allSkills = await SkillTaxonomy.find({});
    const resolved = (parsed.skills || []).map(s => {
      const match = allSkills.find(t =>
        t.name.toLowerCase() === s.skillName?.toLowerCase() ||
        (t.aliases || []).some(a => a.toLowerCase() === s.skillName?.toLowerCase())
      );
      return {
        skillId: match?._id,
        skillName: match?.name || s.skillName,
        proficiency: s.proficiency || 'beginner',
        verified: false,
        source: 'resume',
      };
    });

    // Return AI-prefilled data for user review — NOT saved yet
    res.json({
      prefilled: {
        name: parsed.name,
        email: parsed.email,
        phone: parsed.phone,
        location: parsed.location,
        headline: parsed.headline,
        education: parsed.education || [],
        workHistory: parsed.workHistory || [],
        skills: resolved,
        industry: parsed.industry,
        aiConfidence: parsed.confidence,
        resumeSource: 'upload',
        resumeText: resumeText.slice(0, 5000),
      },
      message: 'Review the extracted data and confirm to save your profile.',
    });
  } catch (err) {
    console.error('Resume parse error:', err);
    res.status(500).json({ error: 'Resume parsing failed: ' + err.message });
  }
});

export default router;

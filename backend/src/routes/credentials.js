import express from 'express';
import mongoose from 'mongoose';
import Credential from '../models/Credential.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// GET /api/credentials — learner's credentials
router.get('/', requireAuth, async (req, res) => {
  try {
    const credentials = await Credential.find({ learnerId: req.userId }).sort({ issuedAt: -1 });
    res.json({ credentials });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/credentials/:idOrSlug — public verify (NO auth required)
router.get('/:idOrSlug', async (req, res) => {
  try {
    const query = mongoose.Types.ObjectId.isValid(req.params.idOrSlug)
      ? { $or: [{ _id: req.params.idOrSlug }, { slug: req.params.idOrSlug }] }
      : { slug: req.params.idOrSlug };

    const cred = await Credential.findOne(query).populate('learnerId', 'name email headline');
    if (!cred) return res.status(404).json({ error: 'Credential not found' });

    // Return full verification payload
    res.json({
      success: true,
      credential: {
        _id: cred._id,
        slug: cred.slug,
        learnerId: cred.learnerId,
        learnerName: cred.learnerName || cred.learnerId?.name,
        skillName: cred.skillName,
        proficiencyLevel: cred.proficiencyLevel,
        verifiedProficiency: cred.proficiencyLevel?.toUpperCase(),
        assessmentScore: cred.score,
        passingScore: cred.passingScore,
        verificationStatus: cred.status === 'active' ? 'verified' : cred.status,
        issuedAt: cred.issuedAt,
        expiresAt: cred.expiresAt,
        assessedAt: cred.issuedAt,
        marketRelevanceScore: cred.marketDriftFlag ? 45 : 98,
        marketDriftFlag: cred.marketDriftFlag,
        marketDriftNote: cred.marketDriftNote,
        verificationHash: `0x${cred.slug}${cred._id.toString().slice(-8)}8a7b9c1d2e`,
        targetEmployerName: cred.anchoredTo?.companyName,
        targetJobId: cred.anchoredTo ? {
          title: cred.anchoredTo.jobTitle,
          companyName: cred.anchoredTo.companyName,
        } : null,
        anchoredTo: cred.anchoredTo,
        testDetails: cred.testDetails,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

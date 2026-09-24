import { nanoid } from 'nanoid';
import Credential from '../models/Credential.js';
import LearningPath from '../models/LearningPath.js';
import LearnerProfile from '../models/LearnerProfile.js';
import SkillDemandDaily from '../models/SkillDemandDaily.js';

// Issue a credential after a successful skill test
export async function issueCredential({ learnerId, learnerName, skillId, skillName, proficiencyLevel, score, passingScore, pathId, anchoredTo, testDetails }) {
  const slug = nanoid(12);
  const issuedAt = new Date();
  const expiresAt = new Date(issuedAt.getTime() + 365 * 24 * 60 * 60 * 1000); // 1 year

  const credential = await Credential.create({
    slug, learnerId, learnerName, skillId, skillName,
    proficiencyLevel, score, passingScore, pathId,
    anchoredTo, issuedAt, expiresAt, status: 'active',
    testDetails,
  });

  // Mark skill as verified in learner profile
  await LearnerProfile.updateOne(
    { userId: learnerId, 'skills.skillName': skillName },
    {
      $set: {
        'skills.$.verified': true,
        'skills.$.verifiedAt': issuedAt,
        'skills.$.proficiency': proficiencyLevel,
        'skills.$.source': 'test',
      },
    }
  );

  // Link credential to learning path
  if (pathId) {
    await LearningPath.updateOne(
      { _id: pathId },
      { $set: { credentialId: credential._id, status: 'completed', completedAt: issuedAt } }
    );
  }

  return credential;
}

// Check for market drift and flag credentials where the bar has shifted
export async function checkMarketDrift() {
  const activeCredentials = await Credential.find({ status: 'active', marketDriftFlag: false });

  for (const cred of activeCredentials) {
    // Get recent demand for this skill
    const recentDemand = await SkillDemandDaily.find({
      skillName: cred.skillName,
      date: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    }).sort({ date: -1 });

    if (recentDemand.length < 2) continue;

    // Simple heuristic: if demand grew > 30% since credential was issued, flag it
    const issueTimeDemand = recentDemand[recentDemand.length - 1]?.count || 0;
    const currentDemand = recentDemand[0]?.count || 0;
    const growth = issueTimeDemand > 0 ? (currentDemand - issueTimeDemand) / issueTimeDemand : 0;

    if (growth > 0.3) {
      await Credential.updateOne(
        { _id: cred._id },
        {
          $set: {
            marketDriftFlag: true,
            marketDriftNote: `Demand for ${cred.skillName} has grown ${Math.round(growth * 100)}% since this credential was issued. Consider refreshing.`,
          },
        }
      );
    }
  }
}

// Expire old credentials
export async function expireOldCredentials() {
  const result = await Credential.updateMany(
    { expiresAt: { $lt: new Date() }, status: 'active' },
    { $set: { status: 'expired' } }
  );
  if (result.modifiedCount > 0) console.log(`Expired ${result.modifiedCount} credentials`);
}

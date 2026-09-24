import mongoose from 'mongoose';

const credentialSchema = new mongoose.Schema({
  slug: { type: String, unique: true, required: true },
  learnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  learnerName: String,
  skillId: { type: mongoose.Schema.Types.ObjectId, ref: 'SkillTaxonomy' },
  skillName: { type: String, required: true },
  proficiencyLevel: { type: String, enum: ['beginner', 'intermediate', 'advanced', 'expert'] },
  score: Number,
  passingScore: Number,
  pathId: { type: mongoose.Schema.Types.ObjectId, ref: 'LearningPath' },

  anchoredTo: {
    jobId: mongoose.Schema.Types.ObjectId,
    jobType: { type: String, enum: ['employer', 'public'] },
    jobTitle: String,
    companyName: String,
    requirementSnapshot: mongoose.Schema.Types.Mixed,
    snapshotDate: Date,
  },

  issuedAt: { type: Date, default: Date.now },
  expiresAt: Date,
  status: { type: String, enum: ['active', 'expired', 'flagged'], default: 'active' },
  marketDriftFlag: { type: Boolean, default: false },
  marketDriftNote: String,

  testDetails: {
    testId: mongoose.Schema.Types.ObjectId,
    questionsAnswered: Number,
    correctAnswers: Number,
    timeTakenMinutes: Number,
    completedAt: Date,
  },
}, { timestamps: true });

credentialSchema.index({ learnerId: 1 });

export default mongoose.model('Credential', credentialSchema);


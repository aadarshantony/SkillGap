import mongoose from 'mongoose';

const stepSchema = new mongoose.Schema({
  order: Number,
  title: String,
  description: String,
  type: { type: String, enum: ['read', 'watch', 'practice', 'project', 'checkpoint'] },
  resourceUrl: String,
  estimatedMinutes: Number,
  completed: { type: Boolean, default: false },
  completedAt: Date,
}, { _id: false });

const learningPathSchema = new mongoose.Schema({
  learnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  skillId: { type: mongoose.Schema.Types.ObjectId, ref: 'SkillTaxonomy' },
  skillName: String,
  targetProficiency: { type: String, enum: ['beginner', 'intermediate', 'advanced', 'expert'] },
  currentProficiency: String,
  // Which job posting triggered this path (for requirement-anchored credentials)
  triggeredBy: {
    jobId: mongoose.Schema.Types.ObjectId,
    jobType: { type: String, enum: ['employer', 'public'] },
    jobTitle: String,
    companyName: String,
    snapshotDate: Date,
  },
  steps: [stepSchema],
  status: { type: String, enum: ['active', 'completed', 'abandoned'], default: 'active' },
  credentialId: { type: mongoose.Schema.Types.ObjectId, ref: 'Credential' },
  createdAt: { type: Date, default: Date.now },
  completedAt: Date,
});

export default mongoose.model('LearningPath', learningPathSchema);

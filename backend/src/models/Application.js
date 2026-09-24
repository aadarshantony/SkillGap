import mongoose from 'mongoose';

const applicationSchema = new mongoose.Schema({
  learnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  jobId: { type: mongoose.Schema.Types.ObjectId, required: true },
  jobType: { type: String, enum: ['employer', 'public'], required: true },
  jobTitle: String,
  companyName: String,
  status: {
    type: String,
    enum: ['draft', 'pending_test', 'submitted', 'viewed', 'shortlisted', 'rejected'],
    default: 'draft',
  },
  triggeredTest: {
    skillName: String,
    testId: mongoose.Schema.Types.ObjectId,
    passed: Boolean,
    score: Number,
  },
  matchScore: Number,        // 0-100 calculated match at time of apply
  submittedAt: Date,
  createdAt: { type: Date, default: Date.now },
});

applicationSchema.index({ learnerId: 1, jobId: 1 }, { unique: true });

export default mongoose.model('Application', applicationSchema);

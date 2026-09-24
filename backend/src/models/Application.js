import mongoose from 'mongoose';

const applicationSchema = new mongoose.Schema({
  learnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  jobId: { type: String, required: true }, // stored as string to support both employer & public jobs
  jobType: { type: String, enum: ['employer', 'public'], required: true },
  jobTitle: String,
  companyName: String,
  status: {
    type: String,
    enum: ['draft', 'pending_test', 'submitted', 'viewed', 'reviewed', 'shortlisted', 'rejected'],
    default: 'submitted',
  },
  triggeredTest: {
    skillName: String,
    testId: mongoose.Schema.Types.ObjectId,
    passed: Boolean,
    score: Number,
  },
  matchScore: { type: Number, default: 0 },  // 0-100 calculated match at time of apply
  submittedAt: Date,
}, { timestamps: true });

applicationSchema.index({ learnerId: 1, jobId: 1 }, { unique: true });
applicationSchema.index({ jobId: 1, jobType: 1 });
applicationSchema.index({ learnerId: 1 });

export default mongoose.model('Application', applicationSchema);

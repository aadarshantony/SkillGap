import mongoose from 'mongoose';

const interviewSchema = new mongoose.Schema({
  employerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  candidateId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  candidateName: { type: String, required: true },
  candidateEmail: { type: String, required: true },
  jobId: { type: String, required: true },
  jobTitle: { type: String, required: true },
  title: { type: String, required: true },
  interviewType: { type: String, enum: ['Initial Screening', 'Technical Assessment', 'HR Interview', 'Final Round'], default: 'Initial Screening' },
  scheduledAt: { type: Date, required: true },
  durationMinutes: { type: Number, default: 45 },
  meetingUrl: { type: String, default: '' },
  notes: { type: String, default: '' },
  status: { type: String, enum: ['scheduled', 'completed', 'cancelled'], default: 'scheduled' },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('Interview', interviewSchema);

import mongoose from 'mongoose';

const skillEntrySchema = new mongoose.Schema({
  skillId: { type: mongoose.Schema.Types.ObjectId, ref: 'SkillTaxonomy' },
  skillName: String,
  proficiency: { type: String, enum: ['beginner', 'intermediate', 'advanced', 'expert'] },
  verified: { type: Boolean, default: false },
  verifiedAt: Date,
  source: { type: String, enum: ['resume', 'manual', 'test'], default: 'manual' },
}, { _id: false });

const learnerProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  headline: String,
  location: String,
  industry: String,
  education: [{
    institution: String,
    degree: String,
    field: String,
    year: Number,
  }],
  workHistory: [{
    title: String,
    company: String,
    duration: String,
    description: String,
  }],
  skills: [skillEntrySchema],
  resumeSource: { type: String, enum: ['upload', 'manual'] },
  resumeText: String,       // raw extracted text for AI re-processing
  aiConfidence: Number,     // 0-1 confidence from AI parse
  profileComplete: { type: Boolean, default: false },
  reviewedAt: Date,         // when learner confirmed AI-prefilled data
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.model('LearnerProfile', learnerProfileSchema);

import mongoose from 'mongoose';

const requirementSchema = new mongoose.Schema({
  skillId: { type: mongoose.Schema.Types.ObjectId, ref: 'SkillTaxonomy' },
  skillName: String,
  proficiency: { type: String, enum: ['beginner', 'intermediate', 'advanced', 'expert'] },
  required: { type: Boolean, default: true }, // vs nice-to-have
}, { _id: false });

const jobEmployerSchema = new mongoose.Schema({
  employerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  companyName: String,
  title: { type: String, required: true },
  description: { type: String, required: true },
  location: String,
  remote: { type: Boolean, default: false },
  industry: String,
  jobType: { type: String, enum: ['full-time', 'part-time', 'contract', 'internship'] },
  requirements: [requirementSchema],
  salaryMin: Number,
  salaryMax: Number,
  currency: { type: String, default: 'INR' },
  active: { type: Boolean, default: true },
  applicants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

jobEmployerSchema.index({ title: 'text', description: 'text' });

export default mongoose.model('JobEmployer', jobEmployerSchema);

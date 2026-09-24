import mongoose from 'mongoose';

// Normalized/cached Adzuna job listing
const jobPublicSchema = new mongoose.Schema({
  adzunaId: { type: String, unique: true },
  title: String,
  company: String,
  location: String,
  description: String,
  url: String,
  salary: {
    min: Number,
    max: Number,
    currency: String,
  },
  category: String,
  industry: String,
  // AI-extracted structured requirements (populated asynchronously)
  extractedSkills: [{
    skillName: String,
    proficiency: String,
    required: Boolean,
  }],
  skillsExtracted: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  fetchedAt: { type: Date, default: Date.now },
});

export default mongoose.model('JobPublic', jobPublicSchema);

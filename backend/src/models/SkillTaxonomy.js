import mongoose from 'mongoose';

const skillTaxonomySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  aliases: [String],          // "JS", "javascript", "JavaScript" all resolve here
  category: { type: String }, // e.g. "Programming", "Retail", "Healthcare"
  industry: [String],         // multi-industry support
  description: String,
  proficiencyLevels: {
    beginner: String,
    intermediate: String,
    advanced: String,
    expert: String,
  },
  createdAt: { type: Date, default: Date.now },
});

// Text index for alias lookup
skillTaxonomySchema.index({ name: 'text', aliases: 'text' });

export default mongoose.model('SkillTaxonomy', skillTaxonomySchema);

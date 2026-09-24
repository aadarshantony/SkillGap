import mongoose from 'mongoose';

// Per-skill, per-day demand aggregate from ingested postings
const skillDemandDailySchema = new mongoose.Schema({
  skillId: { type: mongoose.Schema.Types.ObjectId, ref: 'SkillTaxonomy', required: true },
  skillName: String,
  date: { type: Date, required: true },
  count: { type: Number, default: 0 },       // # postings demanding this skill that day
  sources: {
    adzuna: { type: Number, default: 0 },
    employer: { type: Number, default: 0 },
  },
  regions: [{ region: String, count: Number }],
});

skillDemandDailySchema.index({ skillId: 1, date: -1 });
skillDemandDailySchema.index({ skillName: 1, date: -1 });

export default mongoose.model('SkillDemandDaily', skillDemandDailySchema);

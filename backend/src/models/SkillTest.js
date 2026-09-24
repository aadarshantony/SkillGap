import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  text: String,
  options: [String],
  correctIndex: Number,
  explanation: String,
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'] },
}, { _id: false });

const skillTestSchema = new mongoose.Schema({
  skillId: { type: mongoose.Schema.Types.ObjectId, ref: 'SkillTaxonomy', required: true },
  skillName: String,
  proficiencyLevel: { type: String, enum: ['beginner', 'intermediate', 'advanced', 'expert'] },
  questions: [questionSchema],
  passingScore: { type: Number, default: 70 },  // percentage
  timeLimit: { type: Number, default: 20 },      // minutes
  aiGenerated: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  // Cache per skill+level so we don't re-generate every time
  cacheKey: { type: String, unique: true },
});

export default mongoose.model('SkillTest', skillTestSchema);

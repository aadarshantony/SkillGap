import mongoose from 'mongoose';

const employerProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  companyName: { type: String, required: true },
  industry: String,
  size: { type: String, enum: ['1-10', '11-50', '51-200', '201-500', '500+'] },
  website: String,
  location: String,
  description: String,
  verified: { type: Boolean, default: false },
  logoUrl: String,
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('EmployerProfile', employerProfileSchema);

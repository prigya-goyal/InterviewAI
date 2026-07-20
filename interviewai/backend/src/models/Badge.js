const mongoose = require('mongoose');

const BadgeSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    description: { type: String, default: '' },
    icon: { type: String, default: '' },
    tier: { type: String, enum: ['bronze', 'silver', 'gold', 'platinum'], default: 'bronze' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Badge', BadgeSchema);

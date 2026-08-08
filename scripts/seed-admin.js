/**
 * Seed Script — Create the first admin user directly in auth_db
 * Run ONCE after first `docker-compose up`:
 *
 *   node scripts/seed-admin.js
 *
 * Requires MONGO_URI and a plaintext password in env or as args.
 */
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGO_URI = process.env.MONGO_URI ||
  `mongodb://${process.env.MONGO_ROOT_USER || 'root'}:${process.env.MONGO_ROOT_PASSWORD || 'rootpassword'}@localhost:27017/auth_db?authSource=admin`;

const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
  passwordHash: String,
  membershipId: String,
  role: String,
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

async function seed() {
  const name = process.argv[2] || 'Super Admin';
  const email = process.argv[3] || 'admin@aveonclub.com';
  const password = process.argv[4] || 'Admin@1234';
  const membershipId = process.argv[5] || 'ADMIN001';

  await mongoose.connect(MONGO_URI);
  const User = mongoose.model('User', UserSchema, 'users');

  const existing = await User.findOne({ email });
  if (existing) {
    console.log(`✓ Admin already exists: ${email}`);
    await mongoose.disconnect();
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await User.create({ name, email, passwordHash, membershipId, role: 'admin' });

  console.log(`✓ Admin created successfully!`);
  console.log(`  Email:    ${email}`);
  console.log(`  Password: ${password}`);
  console.log(`  ⚠️  Change this password after first login!`);

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});

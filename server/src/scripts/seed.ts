/**
 * Seeds one account per role with a known password so an evaluator can log in
 * as any role immediately.
 *
 *   npm run seed
 *
 * Idempotent: existing accounts are kept (by email) and their password is reset
 * to SEED_PASSWORD, so the documented credentials always work.
 */
import { connectDatabase, disconnectDatabase } from '../config/db';
import { env } from '../config/env';
import { ROLES, type Role } from '../constants/roles';
import { User } from '../models/User';

const SEED_USERS: { name: string; email: string; role: Role }[] = [
  { name: 'Admin User', email: 'admin@creditsea.com', role: ROLES.ADMIN },
  { name: 'Sales Executive', email: 'sales@creditsea.com', role: ROLES.SALES },
  { name: 'Sanction Executive', email: 'sanction@creditsea.com', role: ROLES.SANCTION },
  { name: 'Disbursement Executive', email: 'disbursement@creditsea.com', role: ROLES.DISBURSEMENT },
  { name: 'Collection Executive', email: 'collection@creditsea.com', role: ROLES.COLLECTION },
  { name: 'Demo Borrower', email: 'borrower@creditsea.com', role: ROLES.BORROWER },
];

async function seed(): Promise<void> {
  await connectDatabase();

  for (const entry of SEED_USERS) {
    const existing = await User.findOne({ email: entry.email }).select('+password');
    if (existing) {
      existing.name = entry.name;
      existing.role = entry.role;
      existing.password = env.SEED_PASSWORD; // pre-save hook re-hashes
      await existing.save();
    } else {
      await User.create({ ...entry, password: env.SEED_PASSWORD });
    }
  }

  console.log('\n✅ Seeded accounts (password for all: %s)\n', env.SEED_PASSWORD);
  console.table(SEED_USERS.map(({ role, email, name }) => ({ role, email, name })));

  await disconnectDatabase();
}

seed().catch((error) => {
  console.error('❌ Seed failed:', error);
  process.exit(1);
});

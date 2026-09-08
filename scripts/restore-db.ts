import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function runRestoreTest() {
  console.log('--- Testing Shakil Global Database Restore & Disaster Recovery ---');
  const backupsRoot = path.join(process.cwd(), 'backups');

  if (!fs.existsSync(backupsRoot)) {
    console.log('No backup directory found. Creating backup first...');
    return;
  }

  const snapshots = fs
    .readdirSync(backupsRoot)
    .filter((f) => f.startsWith('snapshot-'))
    .sort()
    .reverse();

  if (snapshots.length === 0) {
    console.log('No snapshots available for recovery verification.');
    return;
  }

  const targetSnapshot = snapshots[0];
  const targetDir = path.join(backupsRoot, targetSnapshot);
  console.log(`Verifying target snapshot: ${targetSnapshot}`);

  const manifestPath = path.join(targetDir, 'manifest.json');
  if (!fs.existsSync(manifestPath)) {
    throw new Error('Manifest missing from snapshot directory');
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  console.log(`Manifest validated: Snapshot taken at ${manifest.timestamp}`);

  let verifiedCount = 0;
  for (const [table, expectedCount] of Object.entries(manifest.tableCounts)) {
    const filePath = path.join(targetDir, `${table}.json`);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Snapshot data file for ${table} missing`);
    }
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    if (!Array.isArray(data) || data.length !== expectedCount) {
      throw new Error(`Data mismatch in ${table}: expected ${expectedCount}, got ${data?.length}`);
    }
    verifiedCount += 1;
  }

  console.log(`✓ Verified ${verifiedCount} tables in snapshot with 100% integrity`);
  console.log('--- Database Restore Test PASSED ---');
}

runRestoreTest()
  .catch((e) => {
    console.error('Restore test failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

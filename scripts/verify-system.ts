import { PrismaClient, Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { generateFormattedId } from '../src/lib/id-generator';
import { checkRateLimit, resetRateLimit } from '../src/lib/rate-limit';
import { hasPermission } from '../src/lib/rbac';
import { sanitizeData } from '../src/lib/utils';
import { storage } from '../src/lib/storage';
import type { AuthUser, PermissionCode } from '../src/types';

const prisma = new PrismaClient();

async function runTests() {
  console.log('\n=============================================================');
  console.log('🧪 RUNNING SHAKIL GLOBAL RECRUITMENT SYSTEM VERIFICATION');
  console.log('=============================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, message: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // 1. Database Connection & Schema Verification
    console.log('👉 1. Verifying Database & Core Models');
    const userCount = await prisma.user.count();
    const roleCount = await prisma.role.count();
    const permCount = await prisma.permission.count();
    const settingCount = await prisma.systemSetting.count();

    assert(userCount >= 4, `Database contains seeded users (count: ${userCount})`);
    assert(roleCount === 6, `All 6 roles seeded in database (count: ${roleCount})`);
    assert(permCount >= 18, `System permissions present in database (count: ${permCount})`);
    assert(settingCount >= 10, `Database-driven settings initialized (count: ${settingCount})`);

    // 2. Auth & Password Hashing Verification
    console.log('\n👉 2. Verifying Authentication & Cryptography');
    const superAdmin = await prisma.user.findUnique({
      where: { email: 'admin@shakilglobal.com' },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: { permission: true },
            },
          },
        },
      },
    });

    assert(!!superAdmin, 'Super Admin user found in database');
    const isPasswordValid = await bcrypt.compare('Admin@SGR2026!', superAdmin!.passwordHash);
    assert(isPasswordValid, 'Super Admin password hash verifies correctly');
    const isWrongPasswordInvalid = !(await bcrypt.compare('WrongPassword123!', superAdmin!.passwordHash));
    assert(isWrongPasswordInvalid, 'Invalid password correctly rejected');

    // JWT verification
    const secret = new TextEncoder().encode('test_verification_secret_key_123456');
    const token = await new SignJWT({ userId: superAdmin!.id, email: superAdmin!.email, role: 'SUPER_ADMIN' })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('1h')
      .sign(secret);
    const { payload } = await jwtVerify(token, secret);
    assert(payload.userId === superAdmin!.id, 'JWT session token generation and verification passed');

    // 3. RBAC Permissions Engine Verification
    console.log('\n👉 3. Verifying RBAC Engine & Permission Matrix');
    const authAdmin: AuthUser = {
      id: superAdmin!.id,
      name: superAdmin!.name,
      email: superAdmin!.email,
      phone: superAdmin!.phone,
      roleId: superAdmin!.roleId,
      role: {
        id: superAdmin!.role.id,
        name: superAdmin!.role.name,
        description: superAdmin!.role.description,
      },
      permissions: superAdmin!.role.rolePermissions.map((rp) => rp.permission.code),
      isActive: true,
      lastLoginAt: superAdmin!.lastLoginAt,
      createdAt: superAdmin!.createdAt,
    };

    assert(hasPermission(authAdmin, 'USER_CREATE'), 'Super Admin has USER_CREATE permission');
    assert(hasPermission(authAdmin, 'SETTINGS_MANAGE'), 'Super Admin has SETTINGS_MANAGE permission');

    // Recruiter test
    const recruiter = await prisma.user.findUnique({
      where: { email: 'recruiter@shakilglobal.com' },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: { permission: true },
            },
          },
        },
      },
    });

    const authRecruiter: AuthUser = {
      id: recruiter!.id,
      name: recruiter!.name,
      email: recruiter!.email,
      phone: recruiter!.phone,
      roleId: recruiter!.roleId,
      role: {
        id: recruiter!.role.id,
        name: recruiter!.role.name,
        description: recruiter!.role.description,
      },
      permissions: recruiter!.role.rolePermissions.map((rp) => rp.permission.code),
      isActive: true,
      lastLoginAt: recruiter!.lastLoginAt,
      createdAt: recruiter!.createdAt,
    };

    assert(hasPermission(authRecruiter, 'APPLICANT_CREATE'), 'Recruitment Staff has APPLICANT_CREATE permission');
    assert(!hasPermission(authRecruiter, 'USER_CREATE' as PermissionCode), 'Recruitment Staff correctly denied USER_CREATE permission');
    assert(!hasPermission(authRecruiter, 'SETTINGS_MANAGE' as PermissionCode), 'Recruitment Staff correctly denied SETTINGS_MANAGE permission');

    // Inactive user check
    const inactiveUser: AuthUser = { ...authAdmin, isActive: false };
    assert(!hasPermission(inactiveUser, 'DASHBOARD_VIEW'), 'Inactive user barred from all permissions');

    // 4. Formatted Business ID Generator Verification
    console.log('\n👉 4. Verifying Server-Side Business ID Generator');
    const applicantId = await generateFormattedId(prisma, 'applicant', 2026);
    const applicationId = await generateFormattedId(prisma, 'application', 2026);
    const invoiceId = await generateFormattedId(prisma, 'invoice', 2026);

    assert(applicantId.startsWith('SGR-2026-'), `Applicant ID matches SGR-2026-XXXXXX (${applicantId})`);
    assert(applicationId.startsWith('SGR-APP-2026-'), `Application ID matches SGR-APP-2026-XXXXXX (${applicationId})`);
    assert(invoiceId.startsWith('SGR-INV-2026-'), `Invoice ID matches SGR-INV-2026-XXXXXX (${invoiceId})`);

    // 5. User Management CRUD Verification
    console.log('\n👉 5. Verifying User Management CRUD Operations');
    const testEmail = `test_staff_${Date.now()}@shakilglobal.com`;
    const createdStaff = await prisma.user.create({
      data: {
        name: 'Test Staff Automation',
        email: testEmail,
        phone: '+880 1711-999999',
        passwordHash: await bcrypt.hash('Test@SGR2026!', 10),
        roleId: recruiter!.roleId,
        isActive: true,
      },
    });
    assert(!!createdStaff.id, 'Created new test staff member in PostgreSQL');

    // Update staff
    const updatedStaff = await prisma.user.update({
      where: { id: createdStaff.id },
      data: { name: 'Test Staff Updated', isActive: false },
    });
    assert(updatedStaff.name === 'Test Staff Updated', 'Staff member updated successfully');
    assert(updatedStaff.isActive === false, 'Staff member status toggled to inactive');

    // Cleanup test staff
    await prisma.user.delete({ where: { id: createdStaff.id } });
    assert(true, 'Test staff cleaned up');

    // 6. Audit Trail & Data Sanitization Verification
    console.log('\n👉 6. Verifying Audit Trail & Sensitive Field Sanitization');
    const dirtyData = {
      email: 'admin@shakilglobal.com',
      password: 'PlainSecretPassword123!',
      passwordHash: '$2a$12$somehash...',
      token: 'secret_jwt_token',
      name: 'Admin User',
    };
    const sanitized = sanitizeData(dirtyData);
    assert(sanitized.password === '[REDACTED]', 'Password correctly redacted in sanitization');
    assert(sanitized.passwordHash === '[REDACTED]', 'Password hash correctly redacted in sanitization');
    assert(sanitized.token === '[REDACTED]', 'Token correctly redacted in sanitization');
    assert(sanitized.name === 'Admin User', 'Non-sensitive data preserved in sanitization');

    const auditEntry = await prisma.auditLog.create({
      data: {
        userId: superAdmin!.id,
        action: 'VERIFICATION_TEST',
        entity: 'TEST_SUITE',
        ipAddress: '127.0.0.1',
        userAgent: 'Verification Script',
        newValue: JSON.stringify(sanitized),
      },
    });
    assert(!!auditEntry.id, 'Audit log record written and queryable in database');

    // 7. Rate Limiter Verification
    console.log('\n👉 7. Verifying Rate Limiter');
    const testRateKey = 'test_ip_verification_123';
    resetRateLimit(testRateKey);
    let rlPassCount = 0;
    for (let i = 0; i < 5; i++) {
      if (checkRateLimit(testRateKey, 5, 60).success) rlPassCount++;
    }
    const blockedCheck = checkRateLimit(testRateKey, 5, 60);
    assert(rlPassCount === 5, 'Allowed 5 initial requests');
    assert(!blockedCheck.success, 'Rate limiter correctly blocked 6th request');

    // 8. Secure Private Storage Abstraction Verification
    console.log('\n👉 8. Verifying Private Document Storage');
    const testDocPath = 'test/test-passport.pdf';
    const testBuffer = Buffer.from('Mock encrypted PDF passport file content');
    await storage.saveFile(testDocPath, testBuffer);
    const fileExists = await storage.fileExists(testDocPath);
    assert(fileExists, 'Saved private document in protected storage directory');
    const readBuffer = await storage.getFile(testDocPath);
    assert(readBuffer.toString() === testBuffer.toString(), 'Read private document buffer accurately');
    await storage.deleteFile(testDocPath);
    const existsAfterDelete = await storage.fileExists(testDocPath);
    assert(!existsAfterDelete, 'Deleted private test document cleanly');

    // 9. Financial Decimal Precision Verification (Invoice Architecture)
    console.log('\n👉 9. Verifying Decimal Precision on Financial Entities');
    const subtotal = new Prisma.Decimal('25000.00');
    const tax = new Prisma.Decimal('1250.50');
    const total = subtotal.add(tax);
    assert(total.equals(new Prisma.Decimal('26250.50')), 'Decimal arithmetic accurate with zero floating-point error');

    // 10. Database Settings Verification
    console.log('\n👉 10. Verifying Database-Driven Settings');
    const companyName = await prisma.systemSetting.findUnique({
      where: { key: 'company.name' },
    });
    const currency = await prisma.systemSetting.findUnique({
      where: { key: 'system.currency' },
    });
    const timezone = await prisma.systemSetting.findUnique({
      where: { key: 'system.timezone' },
    });

    assert(companyName?.value === 'SHAKIL GLOBAL RECRUITMENT', 'Company name verified from DB');
    assert(currency?.value === 'BDT', 'System currency is BDT');
    assert(timezone?.value === 'Asia/Dhaka', 'System timezone is Asia/Dhaka');

    console.log('\n=============================================================');
    console.log(`📊 TEST SUMMARY: ${passed} PASSED | ${failed} FAILED`);
    console.log('=============================================================\n');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Test execution exception:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePermission } from '@/lib/rbac';
import { updateSettingsSchema } from '@/lib/validations/settings';
import { createAuditLog } from '@/lib/audit';

export async function GET() {
  try {
    const settingsList = await prisma.systemSetting.findMany({
      orderBy: { key: 'asc' },
    });

    const settingsMap: Record<string, string> = {};
    for (const item of settingsList) {
      settingsMap[item.key] = item.value;
    }

    return NextResponse.json({
      success: true,
      data: {
        settings: settingsMap,
        raw: settingsList,
      },
    });
  } catch (error: any) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const currentUser = await requirePermission('SETTINGS_MANAGE');
    const body = await req.json();

    const parsed = updateSettingsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0]?.message || 'Validation error' },
        { status: 400 }
      );
    }

    const { settings } = parsed.data;
    const oldSettings = await prisma.systemSetting.findMany();
    const oldMap: Record<string, string> = {};
    for (const item of oldSettings) {
      oldMap[item.key] = item.value;
    }

    const updatedKeys: string[] = [];

    for (const [key, value] of Object.entries(settings)) {
      if (oldMap[key] !== value) {
        await prisma.systemSetting.upsert({
          where: { key },
          update: { value },
          create: {
            key,
            value,
            group: key.startsWith('company.') ? 'company' : key.startsWith('system.') ? 'system' : 'other',
          },
        });
        updatedKeys.push(key);
      }
    }

    if (updatedKeys.length > 0) {
      await createAuditLog({
        userId: currentUser.id,
        action: 'SETTING_UPDATED',
        entity: 'SETTING',
        entityId: 'SYSTEM',
        oldValue: oldMap,
        newValue: settings,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Settings updated successfully',
      updatedCount: updatedKeys.length,
    });
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error('Error saving settings:', error);
    return NextResponse.json({ success: false, error: 'Failed to update settings' }, { status: 500 });
  }
}

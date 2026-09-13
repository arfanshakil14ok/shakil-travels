import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/rbac';
import { TrashService } from '@/lib/trash-service';

export async function POST(request: NextRequest) {
  try {
    // Only Super Admin and Operations Manager / Director can permanently delete
    const user = await requireRole(['SUPER_ADMIN', 'DIRECTOR', 'OPERATIONS_MANAGER', 'ADMIN']);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { type, id, items, confirmText } = body;

    // Safety check: confirmText must match "PERMANENTLY DELETE" or boolean confirmed
    if (confirmText !== 'PERMANENTLY DELETE' && body.confirmed !== true) {
      return NextResponse.json(
        { error: 'Explicit confirmation required for permanent deletion' },
        { status: 400 }
      );
    }

    // Single item permanent delete
    if (type && id) {
      const result = await TrashService.permanentDelete(type, id, {
        id: user.id,
        name: user.name,
      });
      return NextResponse.json(result);
    }

    // Bulk items permanent delete
    if (Array.isArray(items) && items.length > 0) {
      const results = await TrashService.bulkPermanentDelete(items, {
        id: user.id,
        name: user.name,
      });
      return NextResponse.json({ results });
    }

    return NextResponse.json(
      { error: 'Missing required parameters: (type and id) or items array' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Error permanently deleting trash item:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to permanently delete item' },
      { status: 500 }
    );
  }
}

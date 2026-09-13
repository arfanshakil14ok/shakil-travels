import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/rbac';
import { TrashService } from '@/lib/trash-service';

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { type, id, items } = body;

    // Single item restore
    if (type && id) {
      const result = await TrashService.restore(type, id, {
        id: user.id,
        name: user.name,
      });
      return NextResponse.json(result);
    }

    // Bulk items restore
    if (Array.isArray(items) && items.length > 0) {
      const results = await TrashService.bulkRestore(items, {
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
    console.error('Error restoring trash item:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to restore item' },
      { status: 500 }
    );
  }
}

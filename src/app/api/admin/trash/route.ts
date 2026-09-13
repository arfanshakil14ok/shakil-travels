import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/rbac';
import { TrashService } from '@/lib/trash-service';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || undefined;
    const search = searchParams.get('search') || undefined;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const result = await TrashService.listTrash({
      type,
      search,
      page,
      limit,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error listing trash items:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to list trash items' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { type, id } = body;

    if (!type || !id) {
      return NextResponse.json(
        { error: 'Missing required fields: type and id' },
        { status: 400 }
      );
    }

    const result = await TrashService.softDelete(type, id, {
      id: user.id,
      name: user.name,
      email: user.email,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error soft-deleting item:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to move item to trash' },
      { status: 500 }
    );
  }
}

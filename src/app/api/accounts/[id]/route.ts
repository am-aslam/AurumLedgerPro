import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // SQLite Cascade Delete handles related LedgerRows automatically because of foreign key ON DELETE CASCADE
    db.prepare('DELETE FROM Account WHERE id = ?').run(id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Database failure while deleting account:', error);
    return NextResponse.json({ error: 'Database failure: ' + error.message }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { name, status } = body;

    const accountExists = db.prepare('SELECT * FROM Account WHERE id = ?').get(id) as any;
    if (!accountExists) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    const updatedName = name ?? accountExists.name;
    const updatedStatus = status ?? accountExists.status;

    db.prepare('UPDATE Account SET name = ?, status = ? WHERE id = ?').run(updatedName, updatedStatus, id);

    const account = db.prepare('SELECT * FROM Account WHERE id = ?').get(id);

    return NextResponse.json(account);
  } catch (error: any) {
    console.error('Database failure while updating account:', error);
    return NextResponse.json({ error: 'Database failure: ' + error.message }, { status: 500 });
  }
}

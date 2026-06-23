import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const users = db.prepare('SELECT * FROM VaultUser').all();
    return NextResponse.json(users);
  } catch (error: any) {
    console.error('Database failure while fetching vault users:', error);
    return NextResponse.json({ error: 'Database failure: ' + error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, name, role } = body;

    if (!email || !name || !role) {
      return NextResponse.json({ error: 'Email, name and role are required' }, { status: 400 });
    }

    db.prepare(`
      INSERT INTO VaultUser (email, name, role, status)
      VALUES (?, ?, ?, 'Active')
      ON CONFLICT(email) DO UPDATE SET
        name = excluded.name,
        role = excluded.role,
        status = excluded.status
    `).run(email, name, role);

    const user = db.prepare('SELECT * FROM VaultUser WHERE email = ?').get(email);

    return NextResponse.json(user);
  } catch (error: any) {
    console.error('Database failure while adding vault user:', error);
    return NextResponse.json({ error: 'Database failure: ' + error.message }, { status: 500 });
  }
}

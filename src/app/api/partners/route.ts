import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import crypto from 'crypto';

export async function GET() {
  try {
    const partners = db.prepare('SELECT * FROM Partner').all() as any[];
    for (const partner of partners) {
      partner.history = db.prepare('SELECT * FROM PartnerCapitalHistory WHERE partnerId = ?').all(partner.id);
    }
    return NextResponse.json(partners);
  } catch (error: any) {
    console.error('Database failure while fetching partners:', error);
    return NextResponse.json({ error: 'Database failure: ' + error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, profitShare } = body;

    if (!name || profitShare === undefined) {
      return NextResponse.json({ error: 'Name and profit share are required' }, { status: 400 });
    }

    const id = crypto.randomUUID();
    db.prepare('INSERT INTO Partner (id, name, profitShare, capitalBalance) VALUES (?, ?, ?, 0.0)')
      .run(id, name, parseFloat(profitShare));

    const partner = db.prepare('SELECT * FROM Partner WHERE id = ?').get(id) as any;
    if (partner) {
      partner.history = [];
    }

    return NextResponse.json(partner);
  } catch (error: any) {
    console.error('Database failure while creating partner:', error);
    return NextResponse.json({ error: 'Database failure: ' + error.message }, { status: 500 });
  }
}

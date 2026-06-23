import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import crypto from 'crypto';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { particular, amount, ref } = body;

    if (!particular || amount === undefined) {
      return NextResponse.json({ error: 'Particular and amount are required' }, { status: 400 });
    }

    const partner = db.prepare('SELECT * FROM Partner WHERE id = ?').get(id) as any;

    if (!partner) {
      return NextResponse.json({ error: 'Partner not found' }, { status: 404 });
    }

    const amountNum = parseFloat(amount);
    const dateStr = new Date().toISOString().split('T')[0];
    const historyId = crypto.randomUUID();

    const transaction = db.transaction(() => {
      // Create history entry
      db.prepare(`
        INSERT INTO PartnerCapitalHistory (id, partnerId, date, particular, amount, ref)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(historyId, id, dateStr, particular, amountNum, ref || '');

      // Update partner capital balance
      db.prepare('UPDATE Partner SET capitalBalance = ? WHERE id = ?')
        .run(parseFloat((partner.capitalBalance + amountNum).toFixed(3)), id);
    });

    transaction();

    // Fetch updated partner with history
    const updatedPartner = db.prepare('SELECT * FROM Partner WHERE id = ?').get(id) as any;
    if (updatedPartner) {
      updatedPartner.history = db.prepare('SELECT * FROM PartnerCapitalHistory WHERE partnerId = ?').all(id);
    }

    return NextResponse.json(updatedPartner);
  } catch (error: any) {
    console.error('Database failure while adding partner transaction:', error);
    return NextResponse.json({ error: 'Database failure: ' + error.message }, { status: 500 });
  }
}

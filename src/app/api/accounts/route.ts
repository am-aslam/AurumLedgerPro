import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import crypto from 'crypto';



export async function GET() {
  try {
    const accounts = db.prepare('SELECT * FROM Account').all() as any[];

    // Format attachments from string to array for frontend
    for (const acc of accounts) {
      const rows = db.prepare('SELECT * FROM LedgerRow WHERE accountId = ?').all(acc.id) as any[];
      acc.ledger = rows.map(row => {
        let attachmentsArr = [];
        try {
          attachmentsArr = JSON.parse(row.attachments);
        } catch (e) {
          attachmentsArr = [];
        }
        return {
          ...row,
          attachments: attachmentsArr
        };
      });
    }

    return NextResponse.json(accounts);
  } catch (error: any) {
    console.error('Database failure while fetching accounts:', error);
    return NextResponse.json({ error: 'Database failure: ' + error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, status, grossWeight, stoneWeight, touch, added_touch } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // Check duplicate
    const existing = db.prepare('SELECT id FROM Account WHERE name = ?').get(name);
    if (existing) {
      return NextResponse.json({ error: 'Account with this name already exists' }, { status: 400 });
    }

    const netWeight = grossWeight - stoneWeight;
    const fineWeight = parseFloat(((netWeight * touch) / 100).toFixed(3));

    // Calculate Touch
    const addedTouchNum = parseFloat(added_touch) || 0;
    const touchValue = parseFloat(((netWeight * addedTouchNum) / 100).toFixed(3));

    const dateStr = new Date().toISOString().split('T')[0];
    const accountId = crypto.randomUUID();

    const transaction = db.transaction(() => {
      db.prepare(`
        INSERT INTO Account (id, name, status, lastUpdated, currentBalance)
        VALUES (?, ?, ?, ?, ?)
      `).run(accountId, name, status || 'Active', dateStr, fineWeight);

      if (fineWeight !== 0) {
        const rowId = crypto.randomUUID();
        const createdDate = new Date().toISOString();
        db.prepare(`
          INSERT INTO LedgerRow (id, accountId, date, particular, grossWeight, stoneWeight, netWeight, touch, added_touch, touch_value, debit, credit, balance, notes, attachments, createdDate, updatedDate)
          VALUES (?, ?, ?, 'Opening Balance', ?, ?, ?, ?, ?, ?, 0, ?, ?, 'Manual account initialization physical gold opening balance.', '[]', ?, ?)
        `).run(rowId, accountId, grossWeight, stoneWeight, netWeight, touch, addedTouchNum, touchValue, fineWeight, fineWeight, createdDate, createdDate);
      }
    });

    transaction();

    // Re-fetch full account to return
    const fullAccount = db.prepare('SELECT * FROM Account WHERE id = ?').get(accountId) as any;
    if (fullAccount) {
      const rows = db.prepare('SELECT * FROM LedgerRow WHERE accountId = ?').all(accountId) as any[];
      fullAccount.ledger = rows.map(row => ({
        ...row,
        attachments: []
      }));
      return NextResponse.json(fullAccount);
    }

    return NextResponse.json({ id: accountId, name, status });
  } catch (error: any) {
    console.error('Database failure while creating account:', error);
    return NextResponse.json({ error: 'Database failure: ' + error.message }, { status: 500 });
  }
}

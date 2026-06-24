import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { recalculateBalances } from '@/lib/ledger';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { accountName, rows } = body;

    if (!accountName || !rows || !Array.isArray(rows)) {
      return NextResponse.json({ error: 'AccountName and rows are required' }, { status: 400 });
    }

    // Check if account already exists
    const account = db.prepare('SELECT * FROM Account WHERE name = ?').get(accountName) as any;

    const dateStr = new Date().toISOString().split('T')[0];
    const accountId = account ? account.id : crypto.randomUUID();

    const transaction = db.transaction(() => {
      if (!account) {
        db.prepare(`
          INSERT INTO Account (id, name, status, lastUpdated, currentBalance)
          VALUES (?, ?, 'Active', ?, 0.0)
        `).run(accountId, accountName, dateStr);
      }

      const insertRow = db.prepare(`
        INSERT INTO LedgerRow (id, accountId, date, particular, grossWeight, stoneWeight, netWeight, touch, added_touch, touch_value, fineGold, debit, credit, balance, notes, attachments, createdDate, updatedDate)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, '[]', ?, ?)
      `);

      // Insert all rows in database
      for (const r of rows) {
        const grossNum = parseFloat(r.grossWeight) || 0;
        const stoneNum = parseFloat(r.stoneWeight) || 0;
        const netWeight = parseFloat((grossNum - stoneNum).toFixed(3));
        const touchNum = parseFloat(r.touch) || 0;

        const fineWeight = parseFloat(((netWeight * touchNum) / 100).toFixed(3));

        const isCredit = r.particular === 'Opening Balance' || r.particular === 'WT RCVD';
        const credit = isCredit ? fineWeight : 0;
        const debit = !isCredit ? fineWeight : 0;

        const rowId = crypto.randomUUID();
        const createdDate = new Date().toISOString();

        insertRow.run(
          rowId,
          accountId,
          r.date || dateStr,
          r.particular || 'WT RCVD',
          grossNum,
          stoneNum,
          netWeight,
          touchNum,
          touchNum,
          fineWeight,
          fineWeight,
          debit,
          credit,
          r.notes || '',
          createdDate,
          createdDate
        );
      }
    });

    transaction();

    // Recalculate balances
    recalculateBalances(accountId);

    // Fetch full updated account
    const updatedAccount = db.prepare('SELECT * FROM Account WHERE id = ?').get(accountId) as any;
    if (updatedAccount) {
      const rowsList = db.prepare('SELECT * FROM LedgerRow WHERE accountId = ?').all(accountId) as any[];
      updatedAccount.ledger = rowsList.map(row => {
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

    return NextResponse.json(updatedAccount);
  } catch (error: any) {
    console.error('Database failure during excel import:', error);
    return NextResponse.json({ error: 'Database failure: ' + error.message }, { status: 500 });
  }
}

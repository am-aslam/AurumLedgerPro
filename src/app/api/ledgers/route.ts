import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { recalculateBalances } from '@/lib/ledger';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
      accountId, 
      date, 
      particular, 
      grossWeight, 
      stoneWeight, 
      touch, 
      added_touch,
      notes, 
      attachments 
    } = body;

    if (!accountId) {
      return NextResponse.json({ error: 'AccountId is required' }, { status: 400 });
    }

    const accountExists = db.prepare('SELECT id FROM Account WHERE id = ?').get(accountId);
    if (!accountExists) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    const grossNum = parseFloat(grossWeight) || 0;
    const stoneNum = parseFloat(stoneWeight) || 0;
    const netWeight = parseFloat((grossNum - stoneNum).toFixed(3));
    const touchNum = parseFloat(touch) || 0;
    const addedTouchNum = parseFloat(added_touch) || 0;

    // Purity fineness fine weight
    const fineWeight = parseFloat(((netWeight * addedTouchNum) / 100).toFixed(3));

    const isCredit = particular === 'Opening Balance' || particular === 'WT RCVD';
    const credit = isCredit ? fineWeight : 0;
    const debit = !isCredit ? fineWeight : 0;

    // Added Touch calculations
    const touchValue = parseFloat(((netWeight * addedTouchNum) / 100).toFixed(3));

    const attachmentsStr = Array.isArray(attachments) ? JSON.stringify(attachments) : '[]';
    const rowId = crypto.randomUUID();
    const createdDate = new Date().toISOString();

    // Insert new row
    db.prepare(`
      INSERT INTO LedgerRow (id, accountId, date, particular, grossWeight, stoneWeight, netWeight, touch, added_touch, touch_value, debit, credit, balance, notes, attachments, createdDate, updatedDate)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?)
    `).run(
      rowId,
      accountId,
      date,
      particular,
      grossNum,
      stoneNum,
      netWeight,
      touchNum,
      addedTouchNum,
      touchValue,
      debit,
      credit,
      notes || '',
      attachmentsStr,
      createdDate,
      createdDate
    );

    // Recalculate running balances for this account
    recalculateBalances(accountId);

    // Fetch the updated account with ledger
    const updatedAccount = db.prepare('SELECT * FROM Account WHERE id = ?').get(accountId) as any;
    if (updatedAccount) {
      const rows = db.prepare('SELECT * FROM LedgerRow WHERE accountId = ?').all(accountId) as any[];
      updatedAccount.ledger = rows.map(row => {
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
    console.error('Database failure while adding ledger row:', error);
    return NextResponse.json({ error: 'Database failure: ' + error.message }, { status: 500 });
  }
}

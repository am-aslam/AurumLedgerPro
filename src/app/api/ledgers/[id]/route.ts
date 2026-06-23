import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { recalculateBalances } from '@/lib/ledger';

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Find row to get accountId before deleting
    const row = db.prepare('SELECT accountId FROM LedgerRow WHERE id = ?').get(id) as any;

    if (!row) {
      return NextResponse.json({ error: 'Ledger row not found' }, { status: 404 });
    }

    const { accountId } = row;

    db.prepare('DELETE FROM LedgerRow WHERE id = ?').run(id);

    // Recalculate balances
    recalculateBalances(accountId);

    // Fetch the updated account with ledger
    const updatedAccount = db.prepare('SELECT * FROM Account WHERE id = ?').get(accountId) as any;
    if (updatedAccount) {
      const rows = db.prepare('SELECT * FROM LedgerRow WHERE accountId = ?').all(accountId) as any[];
      updatedAccount.ledger = rows.map(r => {
        let attachmentsArr = [];
        try {
          attachmentsArr = JSON.parse(r.attachments);
        } catch (e) {
          attachmentsArr = [];
        }
        return {
          ...r,
          attachments: attachmentsArr
        };
      });
    }

    return NextResponse.json(updatedAccount);
  } catch (error: any) {
    console.error('Database failure while deleting ledger row:', error);
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

    // Find row
    const row = db.prepare('SELECT * FROM LedgerRow WHERE id = ?').get(id) as any;

    if (!row) {
      return NextResponse.json({ error: 'Ledger row not found' }, { status: 404 });
    }

    const updateData: any = {
      updatedDate: new Date().toISOString()
    };

    // Construct update data based on the fields edited
    if (body.field) {
      const { field, value } = body;
      if (field === 'grossWeight' || field === 'stoneWeight' || field === 'touch' || field === 'added_touch' || field === 'particular') {
        const grossWeight = field === 'grossWeight' ? parseFloat(value) : row.grossWeight;
        const stoneWeight = field === 'stoneWeight' ? parseFloat(value) : row.stoneWeight;
        const touch = field === 'touch' ? parseFloat(value) : row.touch;
        const added_touch = field === 'added_touch' ? parseFloat(value) : row.added_touch;
        const particular = field === 'particular' ? value : row.particular;

        const netWeight = parseFloat((grossWeight - stoneWeight).toFixed(3));
        const fineWeight = parseFloat(((netWeight * added_touch) / 100).toFixed(3));
        const touch_value = parseFloat(((netWeight * added_touch) / 100).toFixed(3));

        const isCredit = particular === 'Opening Balance' || particular === 'WT RCVD';
        const credit = isCredit ? fineWeight : 0;
        const debit = !isCredit ? fineWeight : 0;

        updateData.grossWeight = grossWeight;
        updateData.stoneWeight = stoneWeight;
        updateData.touch = touch;
        updateData.added_touch = added_touch;
        updateData.particular = particular;
        updateData.netWeight = netWeight;
        updateData.touch_value = touch_value;
        updateData.credit = credit;
        updateData.debit = debit;
      } else {
        // Just update the updated field
        updateData[field] = value;
      }
    } else {
      // Full row update (e.g. from Edit Transaction modal)
      const date = body.date ?? row.date;
      const particular = body.particular ?? row.particular;
      const grossWeight = body.grossWeight !== undefined ? parseFloat(body.grossWeight) : row.grossWeight;
      const stoneWeight = body.stoneWeight !== undefined ? parseFloat(body.stoneWeight) : row.stoneWeight;
      const added_touch = body.added_touch !== undefined ? parseFloat(body.added_touch) : row.added_touch;
      const notes = body.notes !== undefined ? body.notes : row.notes;

      const netWeight = parseFloat((grossWeight - stoneWeight).toFixed(3));
      const fineWeight = parseFloat(((netWeight * added_touch) / 100).toFixed(3));
      const touch_value = parseFloat(((netWeight * added_touch) / 100).toFixed(3));

      const isCredit = particular === 'Opening Balance' || particular === 'WT RCVD';
      const credit = isCredit ? fineWeight : 0;
      const debit = !isCredit ? fineWeight : 0;

      updateData.date = date;
      updateData.particular = particular;
      updateData.grossWeight = grossWeight;
      updateData.stoneWeight = stoneWeight;
      updateData.touch = added_touch; // sync both to added_touch
      updateData.added_touch = added_touch;
      updateData.netWeight = netWeight;
      updateData.touch_value = touch_value;
      updateData.credit = credit;
      updateData.debit = debit;
      updateData.notes = notes;
    }

    // Build SQLite SQL update
    const fieldsToUpdate = Object.keys(updateData);
    const sql = `UPDATE LedgerRow SET ${fieldsToUpdate.map(f => `${f} = ?`).join(', ')} WHERE id = ?`;
    const paramsArray = fieldsToUpdate.map(f => updateData[f]);
    paramsArray.push(id);

    db.prepare(sql).run(...paramsArray);

    // Recalculate balances
    recalculateBalances(row.accountId);

    // Fetch the updated account with ledger
    const updatedAccount = db.prepare('SELECT * FROM Account WHERE id = ?').get(row.accountId) as any;
    if (updatedAccount) {
      const rows = db.prepare('SELECT * FROM LedgerRow WHERE accountId = ?').all(row.accountId) as any[];
      updatedAccount.ledger = rows.map(r => {
        let attachmentsArr = [];
        try {
          attachmentsArr = JSON.parse(r.attachments);
        } catch (e) {
          attachmentsArr = [];
        }
        return {
          ...r,
          attachments: attachmentsArr
        };
      });
    }

    return NextResponse.json(updatedAccount);
  } catch (error: any) {
    console.error('Database failure while updating ledger row cell:', error);
    return NextResponse.json({ error: 'Database failure: ' + error.message }, { status: 500 });
  }
}

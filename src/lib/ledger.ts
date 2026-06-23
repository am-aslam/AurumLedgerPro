import { db } from './db';

// Recalculate and update the running balance of all rows for an account, and update the Account model
export function recalculateBalances(accountId: string) {
  const ledgerRows = db.prepare('SELECT * FROM LedgerRow WHERE accountId = ?').all(accountId) as any[];

  // Sort by date, and createdDate/id to make sure ordering is stable
  const sorted = ledgerRows.sort((a, b) => {
    const timeA = new Date(a.date).getTime();
    const timeB = new Date(b.date).getTime();
    if (timeA !== timeB) return timeA - timeB;
    return new Date(a.createdDate).getTime() - new Date(b.createdDate).getTime();
  });

  let runningBalance = 0;
  const updateRow = db.prepare('UPDATE LedgerRow SET balance = ? WHERE id = ?');

  // Perform updates in a fast transaction
  const transaction = db.transaction(() => {
    for (const row of sorted) {
      runningBalance = runningBalance - row.debit + row.credit;
      runningBalance = parseFloat(runningBalance.toFixed(3));
      updateRow.run(runningBalance, row.id);
    }

    // Update account closing balance and lastUpdated date
    const lastUpdated = sorted.length > 0 ? sorted[sorted.length - 1].date : new Date().toISOString().split('T')[0];
    db.prepare('UPDATE Account SET currentBalance = ?, lastUpdated = ? WHERE id = ?').run(
      runningBalance,
      lastUpdated,
      accountId
    );
  });

  transaction();
}

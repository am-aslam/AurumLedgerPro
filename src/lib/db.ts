import Database from 'better-sqlite3';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs';

let dbPath = path.resolve(process.cwd(), 'prisma/dev.db');

if (process.env.VERCEL) {
  const tempDbPath = '/tmp/dev.db';
  try {
    if (!fs.existsSync(tempDbPath)) {
      const srcDbPath = path.resolve(process.cwd(), 'prisma/dev.db');
      if (fs.existsSync(srcDbPath)) {
        fs.copyFileSync(srcDbPath, tempDbPath);
      } else {
        fs.writeFileSync(tempDbPath, '');
      }
    }
    dbPath = tempDbPath;
    console.log('Vercel environment detected. Using writable database at:', dbPath);
  } catch (err) {
    console.error('Failed to set up writable database in /tmp, using default path:', err);
  }
}

const db = new Database(dbPath);
db.pragma('foreign_keys = ON');

// Initialize database schema if not exists
db.exec(`
  CREATE TABLE IF NOT EXISTS Account (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    currentBalance REAL DEFAULT 0.0,
    status TEXT DEFAULT 'Active',
    lastUpdated TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS LedgerRow (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL,
    particular TEXT NOT NULL,
    grossWeight REAL NOT NULL,
    stoneWeight REAL NOT NULL,
    netWeight REAL NOT NULL,
    touch REAL NOT NULL,
    added_touch REAL DEFAULT 0.0,
    touch_value REAL DEFAULT 0.0,
    debit REAL DEFAULT 0.0,
    credit REAL DEFAULT 0.0,
    balance REAL DEFAULT 0.0,
    notes TEXT,
    attachments TEXT DEFAULT '[]',
    createdDate TEXT NOT NULL,
    updatedDate TEXT NOT NULL,
    accountId TEXT NOT NULL,
    FOREIGN KEY(accountId) REFERENCES Account(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS Partner (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    capitalBalance REAL DEFAULT 0.0,
    profitShare REAL NOT NULL
  );

  CREATE TABLE IF NOT EXISTS PartnerCapitalHistory (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL,
    particular TEXT NOT NULL,
    amount REAL NOT NULL,
    ref TEXT NOT NULL,
    partnerId TEXT NOT NULL,
    FOREIGN KEY(partnerId) REFERENCES Partner(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS VaultUser (
    email TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    status TEXT DEFAULT 'Active'
  );

  CREATE TABLE IF NOT EXISTS SystemSetting (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`);

// Seeding check to run exactly once
const setting = db.prepare("SELECT value FROM SystemSetting WHERE key = 'seeded'").get() as any;
const accountCountRes = db.prepare("SELECT COUNT(*) as count FROM Account").get() as any;
const hasAccounts = accountCountRes && accountCountRes.count > 0;

if (!setting) {
  if (!hasAccounts) {
    console.log('Seeding SQLite database with default mock entries...');
    const initialAccountsSeed = [
      {
        name: 'Al-Jazeera Jewellers',
        status: 'Active',
        lastUpdated: '2026-06-12',
        currentBalance: 643.77,
        ledger: [
          {
            date: '2026-06-01',
            particular: 'Opening Balance',
            grossWeight: 500.00,
            stoneWeight: 0.00,
            netWeight: 500.00,
            touch: 99.90,
            added_touch: 0.0,
            touch_value: 0.0,
            debit: 0,
            credit: 499.50,
            balance: 499.50,
            notes: 'Starting balance forward from Excel workbook Sheet1.',
            createdDate: '2026-06-01T09:00:00Z',
            updatedDate: '2026-06-01T09:00:00Z',
            attachments: '["opening_bal_sheet.pdf"]'
          },
          {
            date: '2026-06-05',
            particular: 'WT RCVD',
            grossWeight: 250.50,
            stoneWeight: 0.50,
            netWeight: 250.00,
            touch: 99.50,
            added_touch: 0.0,
            touch_value: 0.0,
            debit: 0,
            credit: 248.75,
            balance: 748.25,
            notes: 'Physical bullion bar deposit.',
            createdDate: '2026-06-05T14:30:00Z',
            updatedDate: '2026-06-05T14:30:00Z',
            attachments: '["assay_receipt.jpg"]'
          },
          {
            date: '2026-06-10',
            particular: 'Sale',
            grossWeight: 100.00,
            stoneWeight: 0.00,
            netWeight: 100.00,
            touch: 99.90,
            added_touch: 0.0,
            touch_value: 0.0,
            debit: 99.90,
            credit: 0,
            balance: 648.35,
            notes: 'Outward bullion delivery order.',
            createdDate: '2026-06-10T11:00:00Z',
            updatedDate: '2026-06-10T11:00:00Z',
            attachments: '[]'
          },
          {
            date: '2026-06-12',
            particular: 'Adjustment',
            grossWeight: 5.20,
            stoneWeight: 0.20,
            netWeight: 5.00,
            touch: 91.60,
            added_touch: 0.0,
            touch_value: 0.0,
            debit: 4.58,
            credit: 0,
            balance: 643.77,
            notes: 'Calibrated weight correction.',
            createdDate: '2026-06-12T16:00:00Z',
            updatedDate: '2026-06-12T16:00:00Z',
            attachments: '[]'
          }
        ]
      },
      {
        name: 'Nadir Refining Corp',
        status: 'Active',
        lastUpdated: '2026-06-08',
        currentBalance: -501.50,
        ledger: [
          {
            date: '2026-06-02',
            particular: 'Opening Balance',
            grossWeight: 1000.00,
            stoneWeight: 0.00,
            netWeight: 1000.00,
            touch: 99.90,
            added_touch: 0.0,
            touch_value: 0.0,
            debit: 999.00,
            credit: 0,
            balance: -999.00,
            notes: 'Owed refinery balance forward.',
            createdDate: '2026-06-02T10:00:00Z',
            updatedDate: '2026-06-02T10:00:00Z',
            attachments: '[]'
          },
          {
            date: '2026-06-08',
            particular: 'WT RCVD',
            grossWeight: 500.00,
            stoneWeight: 0.00,
            netWeight: 500.00,
            touch: 99.50,
            added_touch: 0.0,
            touch_value: 0.0,
            debit: 0,
            credit: 497.50,
            balance: -501.50,
            notes: 'Refined gold bar release.',
            createdDate: '2026-06-08T15:00:00Z',
            updatedDate: '2026-06-08T15:00:00Z',
            attachments: '[]'
          }
        ]
      }
    ];

    const insertAccount = db.prepare(`
      INSERT INTO Account (id, name, status, lastUpdated, currentBalance)
      VALUES (?, ?, ?, ?, ?)
    `);
    const insertRow = db.prepare(`
      INSERT INTO LedgerRow (id, accountId, date, particular, grossWeight, stoneWeight, netWeight, touch, added_touch, touch_value, debit, credit, balance, notes, attachments, createdDate, updatedDate)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const transaction = db.transaction(() => {
      for (const seed of initialAccountsSeed) {
        const accountId = crypto.randomUUID();
        insertAccount.run(accountId, seed.name, seed.status, seed.lastUpdated, seed.currentBalance);

        for (const row of seed.ledger) {
          const rowId = crypto.randomUUID();
          insertRow.run(
            rowId,
            accountId,
            row.date,
            row.particular,
            row.grossWeight,
            row.stoneWeight,
            row.netWeight,
            row.touch,
            row.added_touch,
            row.touch_value,
            row.debit,
            row.credit,
            row.balance,
            row.notes,
            row.attachments,
            row.createdDate,
            row.updatedDate
          );
        }
      }
      db.prepare("INSERT INTO SystemSetting (key, value) VALUES ('seeded', 'true')").run();
    });
    transaction();
  } else {
    db.prepare("INSERT INTO SystemSetting (key, value) VALUES ('seeded', 'true')").run();
  }
}

export { db };

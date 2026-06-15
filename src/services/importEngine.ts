import * as XLSX from 'xlsx';
import prisma from '@/lib/db';
import { LedgerEngine } from './ledgerEngine';

export class ImportEngine {
  /**
   * Reads a raw file buffer and extracts sheets and previews
   */
  static parseSpreadsheet(buffer: Buffer): { sheets: string[]; preview: Record<string, any[]> } {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheets = workbook.SheetNames;
    
    // Extract first 5 rows of the first sheet for preview
    const preview: Record<string, any[]> = {};
    if (sheets.length > 0) {
      const worksheet = workbook.Sheets[sheets[0]];
      const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      preview[sheets[0]] = rawData.slice(0, 5);
    }

    return { sheets, preview };
  }

  /**
   * AI Mapping Assistant: Scoring column headers for semantic mapping
   */
  static suggestMappings(headers: string[]): Record<string, string> {
    const suggestions: Record<string, string> = {};

    const keywords: Record<string, string[]> = {
      date: ['date', 'day', 'timestamp', 'posting date', 'created'],
      customerName: ['customer', 'client', 'account', 'partner', 'company'],
      grossWeight: ['gross', 'weight', 'grossweight', 'gross weight'],
      stoneWeight: ['stone', 'deduct', 'stone weight', 'packaging'],
      purity: ['purity', 'assay', 'fineness', 'karat', 'k', 'fine'],
      debit: ['debit', 'sent', 'outward', 'withdrawn', 'sale'],
      credit: ['credit', 'received', 'inward', 'deposited', 'deposit']
    };

    headers.forEach((header, index) => {
      const cleanHeader = header.toLowerCase().trim();
      const colName = `col_${index}`; // fallback column identifier or header name itself

      for (const [dbField, words] of Object.entries(keywords)) {
        // If exact or submatch found, score it
        const matched = words.some(w => cleanHeader.includes(w));
        if (matched && !suggestions[dbField]) {
          suggestions[dbField] = header; // map database field to sheet header
          break;
        }
      }
    });

    return suggestions;
  }

  /**
   * Validates parsed spreadsheet rows against business rules
   */
  static validateRows(
    rows: any[], 
    mappings: Record<string, string>
  ): { validRows: any[]; errors: Array<{ row: number; error: string }> } {
    const validRows: any[] = [];
    const errors: Array<{ row: number; error: string }> = [];

    rows.forEach((row, index) => {
      const rowNum = index + 2; // +1 for 0-index, +1 for header line
      
      const dateVal = row[mappings.date];
      const grossVal = parseFloat(row[mappings.grossWeight]);
      const purityVal = String(row[mappings.purity] || '999');

      if (!dateVal) {
        errors.push({ row: rowNum, error: 'Posting Date is missing or blank.' });
        return;
      }

      if (isNaN(grossVal) || grossVal <= 0) {
        errors.push({ row: rowNum, error: `Invalid gross weight: ${grossVal}g. must be positive.` });
        return;
      }

      // Validated row is clean
      validRows.push(row);
    });

    return { validRows, errors };
  }

  /**
   * Commits transactional spreadsheet records to the database with a solid rollback policy
   */
  static async commitImport(data: {
    orgId: string;
    userId: string;
    rows: any[];
    mappings: Record<string, string>;
  }) {
    // Database transactional commit with rollback on exception
    return await prisma.$transaction(async (tx) => {
      const logs: any[] = [];

      for (let i = 0; i < data.rows.length; i++) {
        const row = data.rows[i];
        const custName = String(row[data.mappings.customerName] || 'Default Customer');
        
        // 1. Resolve customer profile (create if not found to merge sheets cleanly)
        let customer = await tx.customer.findFirst({
          where: {
            orgId: data.orgId,
            name: { equals: custName, mode: 'insensitive' }
          }
        });

        if (!customer) {
          customer = await tx.customer.create({
            data: {
              orgId: data.orgId,
              name: custName,
              company: custName,
              email: `${custName.toLowerCase().replace(/\s+/g, '')}@imported.com`,
              phone: 'Imported',
              tags: ['Excel Import']
            }
          });
        }

        const gross = parseFloat(row[data.mappings.grossWeight]) || 0;
        const stone = parseFloat(row[data.mappings.stoneWeight]) || 0;
        const net = gross - stone;
        const purityStr = String(row[data.mappings.purity] || '999');
        const fineWeight = LedgerEngine.calculateFineGold(net, purityStr);

        // Assume standard received credit if debit column is empty/0
        const isDebit = parseFloat(row[data.mappings.debit]) > 0;
        const debitVal = isDebit ? fineWeight : 0;
        const creditVal = !isDebit ? fineWeight : 0;

        // 2. Create transaction record
        const voucher = await tx.transaction.create({
          data: {
            orgId: data.orgId,
            createdById: data.userId,
            customerId: customer.id,
            date: new Date(row[data.mappings.date]),
            type: isDebit ? 'Sale' : 'Gold Received',
            invoiceNo: `IMP-INV-${Date.now().toString().slice(-4)}${i}`,
            reference: String(row[data.mappings.reference] || 'EXCEL-UPLOAD'),
            notes: 'Imported via bulk workbook parser engine.',
            origin: 'EXCEL_IMPORT'
          }
        });

        // 3. Post Double entry items
        await tx.transactionItem.createMany({
          data: [
            {
              transactionId: voucher.id,
              grossWeight: gross,
              stoneWeight: stone,
              netWeight: net,
              purity: purityStr,
              fineWeight,
              debit: debitVal,
              credit: creditVal,
              accountCode: '1640-BULLION'
            },
            {
              transactionId: voucher.id,
              grossWeight: gross,
              stoneWeight: stone,
              netWeight: net,
              purity: purityStr,
              fineWeight,
              debit: creditVal,
              credit: debitVal,
              accountCode: '1100-TREASURY'
            }
          ]
        });

        // 4. Adjust customer balances
        const netChange = debitVal - creditVal;
        await tx.customer.update({
          where: { id: customer.id },
          data: {
            balanceGold: { increment: netChange }
          }
        });

        logs.push(voucher);
      }

      // 5. Add global Audit Log representing the bulk operation success
      await tx.auditLog.create({
        data: {
          orgId: data.orgId,
          userEmail: data.userId,
          action: 'Batch Ingestion Commit',
          details: `Excel Ingested ${data.rows.length} rows. Rolled out updates to CRM accounts.`
        }
      });

      return logs;
    });
  }
}

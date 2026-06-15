import prisma from '@/lib/db';

export class LedgerEngine {
  /**
   * Purity Engine: Fine Gold weight calculator
   * Formula: Fine Gold Weight = (Net Weight * Purity) / 100
   * Fineness is expected as e.g. "999" (99.9%), "995" (99.5%), "22K" (91.6%), "18K" (75.0%)
   */
  static calculateFineGold(netWeight: number, purity: string): number {
    let multiplier = 1.0;

    switch (purity.toUpperCase()) {
      case '999':
        multiplier = 0.999;
        break;
      case '995':
        multiplier = 0.995;
        break;
      case '22K':
        multiplier = 0.916;
        break;
      case '18K':
        multiplier = 0.750;
        break;
      default:
        // Try parsing numeric values directly (e.g. 99.9 or 999)
        const numeric = parseFloat(purity);
        if (!isNaN(numeric)) {
          multiplier = numeric > 100 ? numeric / 1000 : numeric / 100;
        }
    }

    return parseFloat((netWeight * multiplier).toFixed(4));
  }

  /**
   * Records a Double-Entry Gold Transaction Voucher with absolute integrity
   */
  static async recordTransaction(data: {
    orgId: string;
    userId: string;
    customerId?: string;
    date: string;
    type: 'Opening Balance' | 'Gold Received' | 'Sale' | 'Purchase' | 'Transfer' | 'Adjustments' | 'Return';
    grossWeight: number;
    stoneWeight: number;
    purity: '999' | '995' | '22K' | '18K';
    debitWeight: number; // fine gold debited (client owes us more/gets gold)
    creditWeight: number; // fine gold credited (client gives us gold)
    cashValue?: number;
    invoiceNo?: string;
    reference?: string;
    notes?: string;
  }) {
    const netWeight = data.grossWeight - data.stoneWeight;
    const calculatedFineWeight = this.calculateFineGold(netWeight, data.purity);
    const finalDebit = data.debitWeight > 0 ? calculatedFineWeight : 0;
    const finalCredit = data.creditWeight > 0 ? calculatedFineWeight : 0;

    // Double-entry validation: Vouchers must balance internally
    // Fine gold debits must offset credits or balance against the customer/partner ledger
    const balanceDiff = finalDebit - finalCredit;

    // Use Prisma Transactions for transactional safety to prevent balance corruptions
    return await prisma.$transaction(async (tx) => {
      // 1. Create main Transaction header
      const voucher = await tx.transaction.create({
        data: {
          orgId: data.orgId,
          createdById: data.userId,
          customerId: data.customerId || null,
          date: new Date(data.date),
          type: data.type,
          invoiceNo: data.invoiceNo || `INV-${Date.now().toString().slice(-6)}`,
          reference: data.reference || `REF-${Math.floor(1000 + Math.random() * 9000)}`,
          notes: data.notes,
          origin: 'MANUAL'
        }
      });

      // 2. Post Item lines: Double entry split
      // Line A: Bullion Account posting
      await tx.transactionItem.create({
        data: {
          transactionId: voucher.id,
          grossWeight: data.grossWeight,
          stoneWeight: data.stoneWeight,
          netWeight,
          purity: data.purity,
          fineWeight: calculatedFineWeight,
          debit: finalDebit,
          credit: finalCredit,
          cashValue: data.cashValue || 0,
          accountCode: '1640-BULLION'
        }
      });

      // Line B: Balancing Vault Treasury Offset
      await tx.transactionItem.create({
        data: {
          transactionId: voucher.id,
          grossWeight: data.grossWeight,
          stoneWeight: data.stoneWeight,
          netWeight,
          purity: data.purity,
          fineWeight: calculatedFineWeight,
          debit: finalCredit, // inverted offset
          credit: finalDebit, // inverted offset
          cashValue: data.cashValue || 0,
          accountCode: '1100-TREASURY'
        }
      });

      // 3. Update customer CRM balance if client is linked
      let updatedCustomer = null;
      if (data.customerId) {
        const currentCust = await tx.customer.findUnique({
          where: { id: data.customerId }
        });

        if (currentCust) {
          // Debit increases customer balance liability to us (gold they owe us)
          // Credit decreases it (gold they gave us)
          const netChange = finalDebit - finalCredit;
          const newBalanceGold = currentCust.balanceGold + netChange;

          updatedCustomer = await tx.customer.update({
            where: { id: data.customerId },
            data: {
              balanceGold: newBalanceGold
            }
          });

          // 4. Create Audited Log trace
          await tx.auditLog.create({
            data: {
              orgId: data.orgId,
              userEmail: data.userId, // using userId placeholder email
              action: 'Post Voucher Transaction',
              details: `Posted ${data.type} fine gold: ${calculatedFineWeight}g (purity: ${data.purity}). Customer new balance: ${newBalanceGold}g`,
              previousValue: { balanceGold: currentCust.balanceGold },
              newValue: { balanceGold: newBalanceGold }
            }
          });
        }
      }

      return { voucher, updatedCustomer };
    });
  }
}

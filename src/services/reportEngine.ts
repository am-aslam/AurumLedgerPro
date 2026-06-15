import prisma from '@/lib/db';

export class ReportEngine {
  /**
   * Compiles Daily Assay Logs and credits/debits totals
   */
  static async compileDailyReport(orgId: string, dateStr: string) {
    const targetDate = new Date(dateStr);
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

    const transactions = await prisma.transaction.findMany({
      where: {
        orgId,
        date: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
      include: {
        items: true,
        customer: true
      }
    });

    let totalCredits = 0;
    let totalDebits = 0;

    transactions.forEach(tx => {
      tx.items.forEach(item => {
        if (item.accountCode === '1640-BULLION') {
          totalCredits += item.credit;
          totalDebits += item.debit;
        }
      });
    });

    return {
      date: dateStr,
      recordCount: transactions.length,
      totalCredits,
      totalDebits,
      netChange: totalCredits - totalDebits,
      transactions: transactions.map(t => ({
        id: t.id,
        customerName: t.customer?.name || 'Internal Vault',
        type: t.type,
        invoiceNo: t.invoiceNo,
        reference: t.reference,
        netWeight: t.items.find(i => i.accountCode === '1640-BULLION')?.netWeight || 0
      }))
    };
  }

  /**
   * Generates partner capital holdings percentage report
   */
  static async compilePartnerCapitalReport(orgId: string) {
    const partners = await prisma.partner.findMany({
      where: { orgId },
      include: {
        capitalAccounts: true
      }
    });

    const totalManagedGold = partners.reduce((sum, p) => sum + p.goldWeight, 0);

    return {
      totalManagedGold,
      partnerStakes: partners.map(p => ({
        partnerName: p.name,
        company: p.company,
        stakePercent: p.stakePercent,
        goldWeight: p.goldWeight,
        estimatedUSDValue: p.goldWeight * 75.12 // standard spot rate estimate
      }))
    };
  }
}

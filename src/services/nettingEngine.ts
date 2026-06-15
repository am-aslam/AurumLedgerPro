import prisma from '@/lib/db';

export interface NettingProposal {
  id: string;
  debtorName: string;
  debtorId: string;
  creditorName: string;
  creditorId: string;
  nettableWeight: number; // weight that can be netted
  suggestedAction: string;
  riskScore: 'Low' | 'Medium' | 'High';
}

export class NettingEngine {
  /**
   * Scans database customer ledgers and generates netting proposals
   */
  static async generateProposals(orgId: string): Promise<NettingProposal[]> {
    // 1. Fetch customers with outstanding balances
    const customers = await prisma.customer.findMany({
      where: { orgId }
    });

    const debtors = customers.filter(c => c.balanceGold > 0).sort((a, b) => b.balanceGold - a.balanceGold); // owes us gold
    const creditors = customers.filter(c => c.balanceGold < 0).sort((a, b) => a.balanceGold - b.balanceGold); // we owe them gold

    const proposals: NettingProposal[] = [];

    // Simple matching algorithm: try matching debtors with creditors to net them out
    debtors.forEach((debtor, idx) => {
      const creditor = creditors[idx % creditors.length];
      if (!creditor) return;

      const nettableWeight = Math.min(debtor.balanceGold, Math.abs(creditor.balanceGold));
      if (nettableWeight <= 0) return;

      proposals.push({
        id: `NET-PROP-${Date.now().toString().slice(-4)}-${idx}`,
        debtorId: debtor.id,
        debtorName: debtor.name,
        creditorId: creditor.id,
        creditorName: creditor.name,
        nettableWeight,
        suggestedAction: `Net off ${nettableWeight.toFixed(2)}g Fine Gold liability of ${debtor.name} against ${creditor.name}'s credit balance.`,
        riskScore: debtor.status === 'risk' || creditor.status === 'risk' ? 'Medium' : 'Low'
      });
    });

    return proposals;
  }

  /**
   * Executes a Netting Proposal by balancing both accounts in a transaction
   */
  static async executeNetting(orgId: string, userId: string, proposal: NettingProposal) {
    return await prisma.$transaction(async (tx) => {
      // 1. Decrease debtor balance (they owe us less)
      const debtor = await tx.customer.update({
        where: { id: proposal.debtorId },
        data: {
          balanceGold: { decrement: proposal.nettableWeight }
        }
      });

      // 2. Increase creditor balance (we owe them less, i.e., move their negative balance closer to 0)
      const creditor = await tx.customer.update({
        where: { id: proposal.creditorId },
        data: {
          balanceGold: { increment: proposal.nettableWeight }
        }
      });

      // 3. Create a balancing Transaction voucher matching this netting operation
      const voucher = await tx.transaction.create({
        data: {
          orgId,
          createdById: userId,
          date: new Date(),
          type: 'Adjustments',
          invoiceNo: `NET-INV-${Date.now().toString().slice(-4)}`,
          reference: `REF-NET-${proposal.id.slice(-4)}`,
          notes: `Automated Netting Reconciliation: offset debtor ${proposal.debtorName} liabilities against creditor ${proposal.creditorName}.`,
          origin: 'SYSTEM'
        }
      });

      // Debit/Credit Items
      await tx.transactionItem.createMany({
        data: [
          {
            transactionId: voucher.id,
            grossWeight: proposal.nettableWeight,
            stoneWeight: 0,
            netWeight: proposal.nettableWeight,
            purity: '999',
            fineWeight: proposal.nettableWeight,
            debit: 0,
            credit: proposal.nettableWeight,
            accountCode: '1640-BULLION'
          },
          {
            transactionId: voucher.id,
            grossWeight: proposal.nettableWeight,
            stoneWeight: 0,
            netWeight: proposal.nettableWeight,
            purity: '999',
            fineWeight: proposal.nettableWeight,
            debit: proposal.nettableWeight,
            credit: 0,
            accountCode: '1100-TREASURY'
          }
        ]
      });

      // 4. Record compliance audit
      await tx.auditLog.create({
        data: {
          orgId,
          userEmail: userId,
          action: 'Authorize Netting Settlement',
          details: `Cleared ${proposal.nettableWeight}g netting offset between ${proposal.debtorName} and ${proposal.creditorName}.`
        }
      });

      return { debtor, creditor, voucher };
    });
  }
}

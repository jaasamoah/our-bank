import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency } from '../mock/data';

interface StatementParams {
  account: {
    name: string;
    accountNumber: string;
    type: string;
    currency: string;
    balance: number;
  };
  customer: {
    fullName?: string;
    email?: string;
    address?: string | null;
  };
  startDate: string;
  endDate: string;
  transactions: Array<{
    date: string;
    description: string;
    reference: string;
    type: string;
    amount: number;
    status: string;
  }>;
}

export function generateAccountStatementPDF({
  account,
  customer,
  startDate,
  endDate,
  transactions,
}: StatementParams) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });

  // Brand Header
  doc.setFillColor(30, 58, 138); // Deep Navy (#1e3a8a)
  doc.rect(0, 0, 595.28, 70, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(255, 255, 255);
  doc.text('VELMONT BANK', 40, 44);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(226, 232, 240);
  doc.text('Official Account Statement', 400, 44);

  // Statement & Customer Meta Information
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text('ACCOUNT HOLDER', 40, 100);
  doc.text('STATEMENT PERIOD', 340, 100);

  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text(customer.fullName || 'Valued Customer', 40, 116);
  doc.setFont('helvetica', 'normal');
  doc.text(customer.email || '', 40, 130);
  if (customer.address) {
    doc.text(customer.address, 40, 144);
  }

  doc.text(`${startDate} to ${endDate}`, 340, 116);
  doc.text(`Account No: ${account.accountNumber}`, 340, 130);
  doc.text(`Account Type: ${account.type.toUpperCase()}`, 340, 144);

  // Summary Metrics Box
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(40, 165, 515.28, 55, 6, 6, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(40, 165, 515.28, 55, 6, 6, 'D');

  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('CURRENT AVAILABLE BALANCE', 55, 185);
  doc.text('TOTAL TRANSACTIONS', 340, 185);

  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text(formatCurrency(account.balance), 55, 205);
  doc.text(String(transactions.length), 340, 205);

  // Transaction Table Rows
  const tableData = transactions.map((t) => [
    new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    t.description,
    t.reference,
    t.type.toUpperCase(),
    t.amount >= 0 ? `+${formatCurrency(t.amount)}` : formatCurrency(t.amount),
    t.status.toUpperCase(),
  ]);

  autoTable(doc, {
    startY: 235,
    head: [['Date', 'Description', 'Reference', 'Type', 'Amount', 'Status']],
    body: tableData.length > 0 ? tableData : [['-', 'No transactions during this period', '-', '-', '-', '-']],
    theme: 'grid',
    headStyles: {
      fillColor: [30, 58, 138],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 8.5,
      textColor: [30, 41, 59],
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 70 },
      1: { cellWidth: 150 },
      2: { cellWidth: 95 },
      3: { cellWidth: 65 },
      4: { cellWidth: 75, halign: 'right' },
      5: { cellWidth: 60, halign: 'center' },
    },
    margin: { left: 40, right: 40 },
  });

  // Footer / Disclaimer
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(148, 163, 184);
  doc.text(
    'This is a computer-generated document from Velmont Bank and requires no signature.',
    40,
    pageHeight - 25,
  );

  doc.save(`Velmont_Statement_${account.accountNumber}_${startDate}_${endDate}.pdf`);
}
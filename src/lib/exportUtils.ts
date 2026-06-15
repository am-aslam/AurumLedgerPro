import * as XLSX from 'xlsx';

/**
 * Export data to an Excel workbook (.xlsx)
 * @param data Array of flat objects to export
 * @param fileName Name of the downloaded file (without extension)
 * @param sheetName Name of the worksheet inside the workbook
 */
export function exportToExcel(data: any[], fileName: string, sheetName: string = 'Sheet1') {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, `${fileName}.xlsx`);
}

/**
 * Export data to a CSV document (.csv)
 * @param data Array of flat objects to export
 * @param fileName Name of the downloaded file (without extension)
 */
export function exportToCSV(data: any[], fileName: string) {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Data');
  XLSX.writeFile(wb, `${fileName}.csv`, { bookType: 'csv' });
}

/**
 * Open print dialogue with custom premium CSS styles to export PDF report
 * @param title Title of the report document
 * @param headers Columns header titles array
 * @param keys Keys mapping to the data object keys
 * @param data Data source array
 * @param aligns Optional alignments per column ('left' | 'right' | 'center')
 */
export function exportToPDF(
  title: string,
  headers: string[],
  keys: string[],
  data: any[],
  aligns: ('left' | 'right' | 'center')[] = []
) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Popup blocker prevented opening the print report window. Please allow popups.');
    return;
  }

  const tableRows = data.map(row => {
    return `<tr>
      ${keys.map((key, idx) => {
        const align = aligns[idx] || 'left';
        const alignClass = align === 'right' ? 'text-align: right;' : align === 'center' ? 'text-align: center;' : 'text-align: left;';
        let val = row[key];
        
        // Formatter adjustments
        if (typeof val === 'number') {
          // If it is a percentage (e.g. Touch)
          if (key.toLowerCase().includes('touch')) {
            val = `${val.toFixed(2)}%`;
          } else if (key.toLowerCase().includes('rate')) {
            val = `$${val.toFixed(2)}`;
          } else {
            val = val.toFixed(2);
          }
        } else if (val === null || val === undefined) {
          val = '-';
        }
        
        return `<td style="padding: 8px 12px; border-bottom: 1px solid #E5E7EB; font-family: monospace; font-size: 11px; ${alignClass}">${val}</td>`;
      }).join('')}
    </tr>`;
  }).join('');

  const tableHeaders = headers.map((header, idx) => {
    const align = aligns[idx] || 'left';
    const alignClass = align === 'right' ? 'text-align: right;' : align === 'center' ? 'text-align: center;' : 'text-align: left;';
    return `<th style="padding: 10px 12px; border-bottom: 2px solid #E5E7EB; background-color: #F9FAFB; color: #374151; font-weight: 700; font-size: 9px; text-transform: uppercase; letter-spacing: 0.05em; ${alignClass}">${header}</th>`;
  }).join('');

  const currentDate = new Date().toLocaleString();

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", Roboto, sans-serif;
            color: #111827;
            padding: 40px;
            margin: 0;
            background-color: #ffffff;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
            margin-top: 15px;
          }
          th {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          @media print {
            body {
              padding: 20px;
            }
            .no-print {
              display: none;
            }
          }
        </style>
      </head>
      <body>
        <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #D4AF37; padding-bottom: 15px; margin-bottom: 25px;">
          <div>
            <div style="font-size: 18px; font-weight: bold; color: #111827; letter-spacing: -0.02em;">AURUMLEDGER PRO</div>
            <div style="font-size: 9px; color: #D4AF37; font-weight: bold; letter-spacing: 0.1em; text-transform: uppercase; margin-top: 2px;">Premium Gold Ledger System</div>
          </div>
          <div style="text-align: right; font-size: 10px; color: #6B7280; line-height: 1.4;">
            <div>Report ID: AL-RPT-${Math.floor(1000 + Math.random() * 9000)}</div>
            <div>Compiled: ${currentDate}</div>
          </div>
        </div>
        
        <div style="margin-bottom: 20px;">
          <h2 style="font-size: 13px; font-weight: 700; color: #111827; margin: 0; text-transform: uppercase; letter-spacing: 0.05em;">${title}</h2>
        </div>
        
        <table>
          <thead>
            <tr>${tableHeaders}</tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
        
        <div style="border-top: 1px solid #E5E7EB; padding-top: 15px; text-align: center; font-size: 9px; color: #9CA3AF; margin-top: 50px;">
          AurumLedger Pro Vault System. Confidential and proprietary ledger statement. Printed securely by current user.
        </div>
        
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 250);
          }
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}

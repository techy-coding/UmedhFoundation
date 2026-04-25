import { useRole } from '../../context/RoleContext';

interface Tax80GReceiptProps {
  donation: {
    id: string;
    amount: string;
    category: string;
    date: string;
    paymentMethod: string;
  };
}

export function Tax80GReceipt({ donation }: Tax80GReceiptProps) {
  const { userName, userEmail } = useRole();

  const receiptHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body {
          font-family: Arial, sans-serif;
          max-width: 800px;
          margin: 0 auto;
          padding: 40px;
          color: #333;
        }
        .header {
          text-align: center;
          border-bottom: 3px solid #FF6B35;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .logo {
          font-size: 32px;
          font-weight: bold;
          color: #FF6B35;
          margin-bottom: 10px;
        }
        .receipt-title {
          font-size: 24px;
          font-weight: bold;
          margin: 20px 0;
          text-align: center;
          color: #6C5CE7;
        }
        .section {
          margin: 20px 0;
          padding: 15px;
          background: #f8f9fa;
          border-radius: 8px;
        }
        .row {
          display: flex;
          justify-content: space-between;
          margin: 10px 0;
          padding: 8px 0;
        }
        .label {
          font-weight: 600;
          color: #555;
        }
        .value {
          color: #333;
        }
        .amount-box {
          background: linear-gradient(135deg, #FF6B35, #6C5CE7);
          color: white;
          padding: 20px;
          border-radius: 12px;
          text-align: center;
          margin: 20px 0;
        }
        .amount-box .amount {
          font-size: 36px;
          font-weight: bold;
          margin: 10px 0;
        }
        .tax-note {
          background: #FFD93D20;
          border-left: 4px solid #FFD93D;
          padding: 15px;
          margin: 20px 0;
          border-radius: 4px;
        }
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 2px solid #eee;
          text-align: center;
          color: #666;
          font-size: 12px;
        }
        .signature {
          margin-top: 60px;
          text-align: right;
        }
        .signature-line {
          border-top: 2px solid #333;
          width: 200px;
          margin: 10px 0 5px auto;
        }
        .print-hide {
          margin-top: 30px;
          text-align: center;
        }
        @media print {
          .print-hide { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">🤍 Umedh Foundation</div>
        <div style="font-size: 14px; color: #666;">
          123 Charity Street, Mumbai, Maharashtra 400001<br>
          Email: contact@umedh.org | Phone: +91-22-1234-5678<br>
          PAN: AABCU1234F | Registration No: E/11111/Mumbai
        </div>
      </div>

      <div class="receipt-title">
        DONATION RECEIPT<br>
        <span style="font-size: 16px; color: #FF6B35;">(Eligible for Tax Deduction u/s 80G)</span>
      </div>

      <div class="section">
        <div class="row">
          <span class="label">Receipt No:</span>
          <span class="value">80G-${donation.id.toUpperCase()}</span>
        </div>
        <div class="row">
          <span class="label">Receipt Date:</span>
          <span class="value">${new Date(donation.date).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
          })}</span>
        </div>
        <div class="row">
          <span class="label">Financial Year:</span>
          <span class="value">2024-25</span>
        </div>
      </div>

      <div class="section">
        <h3 style="margin-top: 0; color: #6C5CE7;">Donor Details</h3>
        <div class="row">
          <span class="label">Name:</span>
          <span class="value">${userName}</span>
        </div>
        <div class="row">
          <span class="label">Email:</span>
          <span class="value">${userEmail}</span>
        </div>
        <div class="row">
          <span class="label">PAN (if provided):</span>
          <span class="value">_______________</span>
        </div>
      </div>

      <div class="amount-box">
        <div style="font-size: 14px; opacity: 0.9;">Donation Amount</div>
        <div class="amount">₹${parseInt(donation.amount).toLocaleString('en-IN')}</div>
        <div style="font-size: 14px; opacity: 0.9;">
          (Rupees ${numberToWords(parseInt(donation.amount))} Only)
        </div>
      </div>

      <div class="section">
        <div class="row">
          <span class="label">Donation Purpose:</span>
          <span class="value">${getCategoryLabel(donation.category)}</span>
        </div>
        <div class="row">
          <span class="label">Payment Mode:</span>
          <span class="value">${donation.paymentMethod.toUpperCase()}</span>
        </div>
        <div class="row">
          <span class="label">Transaction ID:</span>
          <span class="value">TXN${Date.now()}</span>
        </div>
      </div>

      <div class="tax-note">
        <strong>📋 Tax Benefit Information:</strong><br><br>
        This donation qualifies for 50% tax deduction under Section 80G of the Income Tax Act, 1961.<br>
        Tax deductible amount: <strong>₹${Math.floor(parseInt(donation.amount) * 0.5).toLocaleString('en-IN')}</strong><br><br>
        <em>Note: This receipt is valid only if the donation is made to eligible activities as per Section 80G.</em>
      </div>

      <div class="signature">
        <div class="signature-line"></div>
        <div style="margin-top: 5px;">
          <strong>Authorized Signatory</strong><br>
          Umedh Foundation
        </div>
      </div>

      <div class="footer">
        <p>This is a computer-generated receipt and does not require a physical signature.</p>
        <p><strong>Thank you for your generous contribution!</strong></p>
        <p style="margin-top: 10px; font-size: 10px;">
          Umedh Foundation is registered under Section 12A and approved under Section 80G of the Income Tax Act, 1961.<br>
          80G Registration No: AABCU1234FE20214 | Valid from: 01/04/2020
        </p>
      </div>

      <div class="print-hide">
        <button onclick="window.print()" style="
          background: linear-gradient(135deg, #FF6B35, #6C5CE7);
          color: white;
          border: none;
          padding: 12px 30px;
          border-radius: 8px;
          font-size: 16px;
          cursor: pointer;
          margin: 0 10px;
        ">Print Receipt</button>
        <button onclick="window.close()" style="
          background: #e0e0e0;
          color: #333;
          border: none;
          padding: 12px 30px;
          border-radius: 8px;
          font-size: 16px;
          cursor: pointer;
          margin: 0 10px;
        ">Close</button>
      </div>
    </body>
    </html>
  `;

  return receiptHTML;
}

function numberToWords(num: number): string {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];

  if (num === 0) return 'Zero';

  let words = '';

  if (num >= 10000000) {
    words += numberToWords(Math.floor(num / 10000000)) + ' Crore ';
    num %= 10000000;
  }

  if (num >= 100000) {
    words += numberToWords(Math.floor(num / 100000)) + ' Lakh ';
    num %= 100000;
  }

  if (num >= 1000) {
    words += numberToWords(Math.floor(num / 1000)) + ' Thousand ';
    num %= 1000;
  }

  if (num >= 100) {
    words += ones[Math.floor(num / 100)] + ' Hundred ';
    num %= 100;
  }

  if (num >= 20) {
    words += tens[Math.floor(num / 10)] + ' ';
    num %= 10;
  } else if (num >= 10) {
    words += teens[num - 10] + ' ';
    return words.trim();
  }

  if (num > 0) {
    words += ones[num] + ' ';
  }

  return words.trim();
}

function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    general: 'General Fund',
    education: 'Education',
    food: 'Food & Nutrition',
    healthcare: 'Healthcare',
    shelter: 'Shelter',
    emergency: 'Emergency Relief',
  };
  return labels[category] || category;
}

export function download80GReceipt(donation: any) {
  const receiptHTML = Tax80GReceipt({ donation });
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(receiptHTML);
    printWindow.document.close();
  }
}

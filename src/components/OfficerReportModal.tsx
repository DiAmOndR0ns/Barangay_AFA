import React, { useState } from 'react';
import { Member, Meeting, Resolution, FinancialTransaction, SystemLog, Announcement, HogRaisingState, OfficerRole } from '../types';
import { 
  Printer, Download, X, FileText, ShieldCheck, Coins, 
  Users, Megaphone
} from 'lucide-react';

interface OfficerReportModalProps {
  currentRole: OfficerRole;
  members: Member[];
  meetings: Meeting[];
  resolutions: Resolution[];
  transactions: FinancialTransaction[];
  announcements: Announcement[];
  logs: SystemLog[];
  hogRaising?: HogRaisingState;
  onClose: () => void;
  onDownloadBackup?: () => void;
}

export default function OfficerReportModal({
  currentRole,
  members,
  meetings,
  resolutions,
  transactions,
  announcements,
  hogRaising,
  onClose,
  onDownloadBackup
}: OfficerReportModalProps) {
  const isPresident = currentRole === 'President';
  // Non-presidents are strictly locked to their own officer role report
  const defaultRole = isPresident ? 'President' : currentRole;
  const [selectedReportType, setSelectedReportType] = useState<OfficerRole>(defaultRole);
  const [reportDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [customRemarks, setCustomRemarks] = useState<string>('');

  // Enforce role lock if user is not President
  const activeReportRole = isPresident ? selectedReportType : currentRole;

  // Calculations for Financials
  let totalIncome = 0;
  let totalExpense = 0;
  const incomeCategoryTotals: Record<string, number> = {};
  const expenseCategoryTotals: Record<string, number> = {};

  transactions.forEach(t => {
    if (t.type === 'income') {
      totalIncome += t.amount;
      incomeCategoryTotals[t.category] = (incomeCategoryTotals[t.category] || 0) + t.amount;
    } else {
      totalExpense += t.amount;
      expenseCategoryTotals[t.category] = (expenseCategoryTotals[t.category] || 0) + t.amount;
    }
  });

  const netBalance = totalIncome - totalExpense;
  const auditedCount = transactions.filter(t => t.auditedStatus === 'Audited').length;
  const flaggedCount = transactions.filter(t => t.auditedStatus === 'Flagged').length;
  const unauditedCount = transactions.filter(t => !t.auditedStatus || t.auditedStatus === 'Unaudited').length;
  const auditComplianceRate = transactions.length > 0 ? ((auditedCount / transactions.length) * 100).toFixed(1) : '100.0';

  // Calculations for Members
  const activeMembers = members.filter(m => m.status === 'Active');
  const inactiveMembers = members.filter(m => m.status === 'Inactive');
  const sitioCounts: Record<string, number> = {};
  members.forEach(m => {
    const s = m.farmLocation || 'Unassigned';
    sitioCounts[s] = (sitioCounts[s] || 0) + 1;
  });

  // Officer names
  const getOfficerNameByRole = (r: OfficerRole) => {
    switch (r) {
      case 'President': return 'Zenaida A. Elbiña';
      case 'Vice_President': return 'Anselna B. Arnado';
      case 'Secretary': return 'Jennylyn S. Lumactao';
      case 'Treasurer': return 'Gracelyn P. Asendiente';
      case 'Auditor': return 'Lorena B. Pinote';
      case 'PIO': return 'Ida S. Manera';
      default: return 'BAFA Officer';
    }
  };

  // Printable report handler
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to open the print view.');
      return;
    }

    const titleMap: Record<OfficerRole, string> = {
      Treasurer: "TREASURER'S OFFICIAL FINANCIAL & CASH FLOW REPORT",
      Auditor: "AUDITOR'S FINANCIAL OVERSIGHT & COMPLIANCE REPORT",
      Secretary: "SECRETARY'S MEMBERSHIP & LEGISLATIVE MINUTES REPORT",
      President: "PRESIDENT'S CONSOLIDATED EXECUTIVE SUMMARY OF ALL OFFICER REPORTS",
      Vice_President: "VICE PRESIDENT'S EXECUTIVE ADMINISTRATION REPORT",
      PIO: "PUBLIC INFORMATION OFFICER (PIO) COMMUNITY COMMUNICATIONS REPORT"
    };

    const docTitle = titleMap[activeReportRole] || 'BAFA OFFICIAL OFFICER REPORT';

    let contentHtml = '';

    if (activeReportRole === 'Treasurer') {
      contentHtml = `
        <div class="section-title">1. FINANCIAL OVERVIEW & CASH BALANCE</div>
        <table>
          <tr><th>Category</th><th>Amount (PHP)</th></tr>
          <tr><td><strong>Total Association Income</strong></td><td style="color: green;">+ PHP ${totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td></tr>
          <tr><td><strong>Total Expenditures</strong></td><td style="color: red;">- PHP ${totalExpense.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td></tr>
          <tr style="background:#f1f5f9;"><td><strong>NET GENERAL FUND BALANCE</strong></td><td><strong>PHP ${netBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong></td></tr>
        </table>

        <div class="section-title">2. ITEMIZATION OF REVENUE BY CATEGORY</div>
        <table>
          <tr><th>Income Category</th><th>Total Received (PHP)</th></tr>
          ${Object.entries(incomeCategoryTotals).map(([cat, amt]) => `
            <tr><td>${cat}</td><td>PHP ${amt.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td></tr>
          `).join('') || '<tr><td colspan="2">No income entries recorded.</td></tr>'}
        </table>

        <div class="section-title">3. ITEMIZATION OF EXPENDITURES BY CATEGORY</div>
        <table>
          <tr><th>Expense Category</th><th>Total Disbursed (PHP)</th></tr>
          ${Object.entries(expenseCategoryTotals).map(([cat, amt]) => `
            <tr><td>${cat}</td><td>PHP ${amt.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td></tr>
          `).join('') || '<tr><td colspan="2">No expense entries recorded.</td></tr>'}
        </table>

        <div class="section-title">4. DETAILED TRANSACTION LEDGER</div>
        <table>
          <thead>
            <tr><th>Date</th><th>Type</th><th>Category</th><th>Description</th><th>Recorded By</th><th>Amount</th><th>Audit Status</th></tr>
          </thead>
          <tbody>
            ${transactions.map(t => `
              <tr>
                <td>${t.date}</td>
                <td><span class="${t.type}">${t.type.toUpperCase()}</span></td>
                <td>${t.category}</td>
                <td>${t.description}</td>
                <td>${t.recordedBy}</td>
                <td>PHP ${t.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                <td>${t.auditedStatus || 'Unaudited'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    } else if (activeReportRole === 'Auditor') {
      contentHtml = `
        <div class="section-title">1. AUDIT EVALUATION SUMMARY</div>
        <table>
          <tr><th>Audit Metric</th><th>Evaluation Outcome</th></tr>
          <tr><td>Total Transactions Examined</td><td>${transactions.length} Record(s)</td></tr>
          <tr><td>Verified & Audited OK</td><td style="color: green; font-weight: bold;">${auditedCount} Transaction(s)</td></tr>
          <tr><td>Flagged Discrepancy Items</td><td style="color: red; font-weight: bold;">${flaggedCount} Item(s)</td></tr>
          <tr><td>Pending Audit Verification</td><td>${unauditedCount} Item(s)</td></tr>
          <tr><td>Overall Audit Compliance Rate</td><td><strong>${auditComplianceRate}%</strong></td></tr>
        </table>

        <div class="section-title">2. FLAGGED ITEMS & ACTION REQUIRED</div>
        <table>
          <thead>
            <tr><th>Date</th><th>Category</th><th>Description</th><th>Amount</th><th>Audit Notes / Discrepancy Reason</th></tr>
          </thead>
          <tbody>
            ${transactions.filter(t => t.auditedStatus === 'Flagged').map(t => `
              <tr style="background-color: #fef2f2;">
                <td>${t.date}</td>
                <td>${t.category}</td>
                <td>${t.description}</td>
                <td>PHP ${t.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                <td>${t.auditNotes || 'Requires official receipts or documentation clarification.'}</td>
              </tr>
            `).join('') || '<tr><td colspan="5" style="color: green; text-align: center;">No flagged financial items found. All audited records meet co-op standards.</td></tr>'}
          </tbody>
        </table>
      `;
    } else if (activeReportRole === 'Secretary') {
      contentHtml = `
        <div class="section-title">1. MEMBERSHIP ROSTER STATISTICS</div>
        <table>
          <tr><th>Metric</th><th>Count</th></tr>
          <tr><td>Total Active Members</td><td style="color: green; font-weight: bold;">${activeMembers.length} Members</td></tr>
          <tr><td>Inactive / On-Leave Members</td><td>${inactiveMembers.length} Members</td></tr>
          <tr style="background:#f1f5f9;"><td><strong>Total Registered Roster</strong></td><td><strong>${members.length} Members</strong></td></tr>
        </table>

        <div class="section-title">2. SITIO LOCATION BREAKDOWN</div>
        <table>
          <tr><th>Sitio Location</th><th>Registered Members</th></tr>
          ${Object.entries(sitioCounts).map(([sitio, count]) => `
            <tr><td>${sitio}</td><td>${count} Members</td></tr>
          `).join('')}
        </table>

        <div class="section-title">3. LEGISLATIVE RESOLUTIONS SUMMARY</div>
        <table>
          <thead>
            <tr><th>Res #</th><th>Title</th><th>Status</th><th>Moved By</th><th>Seconded By</th><th>Votes (Favor - Against - Abstain)</th></tr>
          </thead>
          <tbody>
            ${resolutions.map(r => `
              <tr>
                <td><strong>${r.resolutionNumber}</strong></td>
                <td>${r.title}</td>
                <td><span class="${r.status === 'Approved' ? 'income' : 'expense'}">${r.status}</span></td>
                <td>${r.movedBy}</td>
                <td>${r.secondedBy}</td>
                <td>${r.voteInFavor} - ${r.voteAgainst} - ${r.voteAbstain}</td>
              </tr>
            `).join('') || '<tr><td colspan="6">No resolutions recorded.</td></tr>'}
          </tbody>
        </table>

        <div class="section-title">4. GENERAL ASSEMBLY MEETINGS LOG</div>
        <table>
          <thead>
            <tr><th>Date</th><th>Title / Assembly</th><th>Location</th><th>Attendees Count</th></tr>
          </thead>
          <tbody>
            ${meetings.map(m => `
              <tr>
                <td>${m.date}</td>
                <td>${m.title}</td>
                <td>${m.location}</td>
                <td>${m.attendanceCount} Members Present</td>
              </tr>
            `).join('') || '<tr><td colspan="4">No meetings logged.</td></tr>'}
          </tbody>
        </table>
      `;
    } else if (activeReportRole === 'President') {
      // PRESIDENT'S CONSOLIDATED EXECUTIVE SUMMARY OF ALL EXECUTIVE OFFICERS
      contentHtml = `
        <div class="section-title">1. EXECUTIVE OVERVIEW & STATE OF THE ASSOCIATION</div>
        <table>
          <tr><th>Executive Key Performance Indicator</th><th>Current Status Outcome</th></tr>
          <tr><td>Total Registered Farmer Roster</td><td><strong>${members.length} Members (${activeMembers.length} Active, ${inactiveMembers.length} Inactive)</strong></td></tr>
          <tr><td>General Fund Financial Cash Balance</td><td><strong>PHP ${netBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong></td></tr>
          <tr><td>LGU Tuburan Assistance & Grant Allocation</td><td>PHP 1,000,000.00 Dedicated Livelihood Capital</td></tr>
          <tr><td>Passed Legislative Resolutions</td><td>${resolutions.filter(r => r.status === 'Approved').length} Approved Resolution(s)</td></tr>
          <tr><td>Financial Audit Integrity Rate</td><td><strong>${auditComplianceRate}% Verified Compliance</strong></td></tr>
          <tr><td>Public Announcements Broadcasted</td><td>${announcements.length} Published Advisories (${announcements.filter(a => a.priority === 'High').length} High Priority)</td></tr>
        </table>

        <div class="section-title">2. TREASURER'S FINANCIAL DEPARTMENT SUMMARY</div>
        <table>
          <tr><th>Financial Metric</th><th>Amount (PHP)</th></tr>
          <tr><td>Total Gross Revenue Collected</td><td style="color: green; font-weight: bold;">+ PHP ${totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td></tr>
          <tr><td>Total Disbursed Operating Expenses</td><td style="color: red; font-weight: bold;">- PHP ${totalExpense.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td></tr>
          <tr style="background:#f1f5f9;"><td><strong>NET CASH FUND BALANCE</strong></td><td><strong>PHP ${netBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong></td></tr>
        </table>

        <div class="section-title">3. AUDITOR'S FINANCIAL OVERSIGHT SUMMARY</div>
        <table>
          <tr><th>Audit Metric</th><th>Details</th></tr>
          <tr><td>Transactions Evaluated</td><td>${transactions.length} Total Ledger Items</td></tr>
          <tr><td>Verified & Audited OK</td><td style="color: green; font-weight: bold;">${auditedCount} Transaction(s)</td></tr>
          <tr><td>Flagged Discrepancies Requiring Review</td><td style="color: red; font-weight: bold;">${flaggedCount} Item(s)</td></tr>
          <tr><td>Audit Compliance Rate</td><td><strong>${auditComplianceRate}%</strong></td></tr>
        </table>

        <div class="section-title">4. SECRETARY'S MEMBERSHIP & LEGISLATIVE ASSEMBLY SUMMARY</div>
        <table>
          <tr><th>Secretariat Metric</th><th>Details</th></tr>
          <tr><td>Registered Roster Count</td><td>${members.length} Farmers (${activeMembers.length} Active)</td></tr>
          <tr><td>Sitio Locations Covered</td><td>${Object.keys(sitioCounts).length} Sitio Communities</td></tr>
          <tr><td>Passed Legislative Resolutions</td><td>${resolutions.filter(r => r.status === 'Approved').length} Approved out of ${resolutions.length} Total</td></tr>
          <tr><td>General Assembly Sessions Held</td><td>${meetings.length} Recorded Meetings</td></tr>
        </table>

        <div class="section-title">5. PUBLIC INFORMATION OFFICER (PIO) SUMMARY</div>
        <table>
          <tr><th>PIO Metric</th><th>Details</th></tr>
          <tr><td>Total Community Bulletins Published</td><td>${announcements.length} Announcements</td></tr>
          <tr><td>Urgent LGU & Weather Advisories</td><td>${announcements.filter(a => a.priority === 'High').length} High-Priority Bulletins</td></tr>
        </table>

        ${hogRaising ? `
          <div class="section-title">6. HOG RAISING IGP LIVELIHOOD PROJECT SUMMARY</div>
          <table>
            <tr><th>IGP Metric</th><th>Details</th></tr>
            <tr><td>Total Operating Expenses Recorded</td><td>PHP ${(hogRaising.expenses || []).reduce((acc, e) => acc + e.amount, 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td></tr>
            <tr><td>Active Volunteer Chore Groups</td><td>${hogRaising.groups?.length || 0} Member Teams</td></tr>
            <tr><td>Total Batch Sales Revenue Collected</td><td>PHP ${(hogRaising.sales || []).reduce((acc, s) => acc + s.revenue, 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td></tr>
          </table>
        ` : ''}

        <div class="section-title">7. EXECUTIVE OFFICERS DIRECTORY</div>
        <table>
          <thead>
            <tr><th>Role</th><th>Officer Name</th><th>Designation</th></tr>
          </thead>
          <tbody>
            <tr><td>President</td><td>Zenaida A. Elbiña</td><td>Chief Executive Officer</td></tr>
            <tr><td>Vice President</td><td>Anselna B. Arnado</td><td>Executive Vice Chairman</td></tr>
            <tr><td>Secretary</td><td>Jennylyn S. Lumactao</td><td>Records & Secretariat Head</td></tr>
            <tr><td>Treasurer</td><td>Gracelyn P. Asendiente</td><td>General Custodian of Funds</td></tr>
            <tr><td>Auditor</td><td>Lorena B. Pinote</td><td>Chief Financial Auditor</td></tr>
            <tr><td>PIO</td><td>Ida S. Manera</td><td>Public Information Officer</td></tr>
          </tbody>
        </table>
      `;
    } else if (activeReportRole === 'PIO') {
      contentHtml = `
        <div class="section-title">1. PUBLIC ANNOUNCEMENTS & ADVISORIES SUMMARY</div>
        <table>
          <tr><th>Metric</th><th>Count</th></tr>
          <tr><td>Total Bulletins Published</td><td>${announcements.length} Announcement(s)</td></tr>
          <tr><td>High Priority Advisories</td><td>${announcements.filter(a => a.priority === 'High').length} Bulletins</td></tr>
        </table>

        <div class="section-title">2. RECENT BULLETIN BROADCASTS</div>
        <table>
          <thead>
            <tr><th>Date Posted</th><th>Category</th><th>Title</th><th>Priority</th><th>Posted By</th></tr>
          </thead>
          <tbody>
            ${announcements.map(a => `
              <tr>
                <td>${a.datePosted}</td>
                <td>${a.category}</td>
                <td><strong>${a.title}</strong></td>
                <td>${a.priority}</td>
                <td>${a.postedBy}</td>
              </tr>
            `).join('') || '<tr><td colspan="5">No announcements recorded.</td></tr>'}
          </tbody>
        </table>
      `;
    } else if (activeReportRole === 'Vice_President') {
      contentHtml = `
        <div class="section-title">1. VICE PRESIDENT ADMINISTRATION & COMMITTEE REPORT</div>
        <table>
          <tr><th>Executive Metric</th><th>Current Status</th></tr>
          <tr><td>Total Registered Farmer Members</td><td><strong>${members.length} Members (${activeMembers.length} Active)</strong></td></tr>
          <tr><td>General Fund Financial Health</td><td><strong>PHP ${netBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong></td></tr>
          <tr><td>Committees Supervised</td><td>6 Active Operational Units</td></tr>
          <tr><td>Passed Resolutions Oversight</td><td>${resolutions.filter(r => r.status === 'Approved').length} Approved Resolutions</td></tr>
        </table>
      `;
    }

    const remarksBlock = customRemarks ? `
      <div class="section-title">OFFICER REMARKS & SPECIAL NOTES</div>
      <div style="background:#f8fafc; border: 1px solid #cbd5e1; padding: 12px; border-radius: 8px; font-size: 11px; font-style: italic; margin-bottom: 20px;">
        "${customRemarks.replace(/\n/g, '<br/>')}"
      </div>
    ` : '';

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${docTitle}</title>
          <style>
            @page { size: A4; margin: 15mm; }
            body { font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 11px; color: #1e293b; line-height: 1.5; padding: 10px; }
            .header-container { text-align: center; border-bottom: 2px solid #0f766e; padding-bottom: 12px; margin-bottom: 20px; }
            .republic { font-size: 10px; font-weight: bold; text-transform: uppercase; color: #475569; letter-spacing: 0.5px; }
            .assoc-name { font-size: 18px; font-weight: 900; color: #065f46; margin: 4px 0; font-family: serif; }
            .location { font-size: 10px; color: #64748b; font-weight: 600; }
            .doc-title { font-size: 13px; font-weight: 800; text-align: center; margin: 15px 0; background: #ecfdf5; border: 1px solid #a7f3d0; padding: 8px; border-radius: 6px; color: #065f46; letter-spacing: 0.5px; }
            .meta-bar { display: flex; justify-content: space-between; font-size: 10px; color: #475569; margin-bottom: 15px; background: #f8fafc; padding: 8px 12px; border-radius: 6px; border: 1px solid #e2e8f0; }
            .section-title { font-size: 11px; font-weight: 800; text-transform: uppercase; color: #0f766e; margin-top: 18px; margin-bottom: 8px; border-bottom: 1px solid #cbd5e1; padding-bottom: 3px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 10px; }
            th, td { border: 1px solid #cbd5e1; padding: 6px 8px; text-align: left; }
            th { background-color: #f1f5f9; color: #334155; font-weight: bold; text-transform: uppercase; font-size: 9px; }
            .income { color: #166534; font-weight: bold; }
            .expense { color: #991b1b; font-weight: bold; }
            .signature-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-top: 40px; page-break-inside: avoid; }
            .sig-box { text-align: center; font-size: 10px; }
            .sig-line { border-bottom: 1px solid #334155; margin-bottom: 4px; height: 35px; }
            .sig-name { font-weight: bold; color: #0f172a; text-transform: uppercase; }
            .sig-title { color: #64748b; font-size: 9px; }
            .seal-stamp { text-align: center; margin-top: 25px; font-size: 9px; color: #94a3b8; font-style: italic; }
          </style>
        </head>
        <body>
          <div class="header-container">
            <div class="republic">Republic of the Philippines • Province of Cebu • Municipality of Tuburan</div>
            <div class="assoc-name">ALEGRIA FARMERS ASSOCIATION (BAFA)</div>
            <div class="location">Barangay Alegria, Tuburan, Cebu • Official LGU & Cooperative Administration Registry</div>
          </div>

          <div class="doc-title">${docTitle}</div>

          <div class="meta-bar">
            <span><strong>Date Generated:</strong> ${reportDate}</span>
            <span><strong>Prepared By:</strong> ${getOfficerNameByRole(activeReportRole)} (${activeReportRole})</span>
            <span><strong>Status:</strong> Official Certified Record</span>
          </div>

          ${contentHtml}

          ${remarksBlock}

          <div class="signature-grid">
            <div class="sig-box">
              <div class="sig-line"></div>
              <div class="sig-name">${getOfficerNameByRole(activeReportRole)}</div>
              <div class="sig-title">Preparing Officer (${activeReportRole})</div>
            </div>

            <div class="sig-box">
              <div class="sig-line"></div>
              <div class="sig-name">Lorena B. Pinote</div>
              <div class="sig-title">Auditor Verification</div>
            </div>

            <div class="sig-box">
              <div class="sig-line"></div>
              <div class="sig-name">Zenaida A. Elbiña</div>
              <div class="sig-title">President (Approved & Attested)</div>
            </div>
          </div>

          <div class="seal-stamp">
            *** Certified Official Report of the Alegria Farmers Association (BAFA) - Barangay Alegria, Tuburan, Cebu ***
          </div>

          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // CSV Export handler
  const handleExportCSV = () => {
    const csvRows: string[] = [];

    if (activeReportRole === 'Treasurer') {
      csvRows.push('BAFA OFFICIAL TREASURER FINANCIAL REPORT');
      csvRows.push(`Date Generated,${reportDate}`);
      csvRows.push(`Prepared By,${getOfficerNameByRole('Treasurer')}`);
      csvRows.push('');
      csvRows.push('SUMMARY');
      csvRows.push(`Total Income (PHP),${totalIncome.toFixed(2)}`);
      csvRows.push(`Total Expenditures (PHP),${totalExpense.toFixed(2)}`);
      csvRows.push(`Net Balance (PHP),${netBalance.toFixed(2)}`);
      csvRows.push('');
      csvRows.push('TRANSACTION LEDGER');
      csvRows.push('ID,Date,Type,Category,Description,Recorded By,Amount (PHP),Audit Status');
      transactions.forEach(t => {
        csvRows.push([
          t.id,
          t.date,
          t.type,
          `"${t.category.replace(/"/g, '""')}"`,
          `"${t.description.replace(/"/g, '""')}"`,
          `"${t.recordedBy.replace(/"/g, '""')}"`,
          t.amount.toFixed(2),
          t.auditedStatus || 'Unaudited'
        ].join(','));
      });
    } else if (activeReportRole === 'Auditor') {
      csvRows.push('BAFA OFFICIAL AUDITOR INSPECTION REPORT');
      csvRows.push(`Date Generated,${reportDate}`);
      csvRows.push(`Auditor,${getOfficerNameByRole('Auditor')}`);
      csvRows.push('');
      csvRows.push('AUDIT METRICS');
      csvRows.push(`Total Evaluated,${transactions.length}`);
      csvRows.push(`Audited OK,${auditedCount}`);
      csvRows.push(`Flagged Discrepancies,${flaggedCount}`);
      csvRows.push(`Compliance Rate (%),${auditComplianceRate}`);
      csvRows.push('');
      csvRows.push('FLAGGED TRANSACTIONS');
      csvRows.push('ID,Date,Category,Description,Amount (PHP),Audit Notes');
      transactions.filter(t => t.auditedStatus === 'Flagged').forEach(t => {
        csvRows.push([
          t.id,
          t.date,
          `"${t.category.replace(/"/g, '""')}"`,
          `"${t.description.replace(/"/g, '""')}"`,
          t.amount.toFixed(2),
          `"${(t.auditNotes || '').replace(/"/g, '""')}"`
        ].join(','));
      });
    } else if (activeReportRole === 'Secretary') {
      csvRows.push('BAFA OFFICIAL SECRETARY ROSTER & LEGISLATIVE REPORT');
      csvRows.push(`Date Generated,${reportDate}`);
      csvRows.push(`Secretary,${getOfficerNameByRole('Secretary')}`);
      csvRows.push('');
      csvRows.push('MEMBERSHIP ROSTER');
      csvRows.push('ID,Name,Sitio Location,Farm Size (ha),Primary Crops,Status,Joined Date');
      members.forEach(m => {
        csvRows.push([
          m.id,
          `"${m.name.replace(/"/g, '""')}"`,
          `"${m.farmLocation.replace(/"/g, '""')}"`,
          m.farmSize.toString(),
          `"${m.primaryCrops.join('; ').replace(/"/g, '""')}"`,
          m.status,
          m.joinedDate
        ].join(','));
      });
      csvRows.push('');
      csvRows.push('RESOLUTIONS');
      csvRows.push('Resolution Number,Title,Status,Moved By,Seconded By,In Favor,Against,Abstain');
      resolutions.forEach(r => {
        csvRows.push([
          `"${r.resolutionNumber.replace(/"/g, '""')}"`,
          `"${r.title.replace(/"/g, '""')}"`,
          r.status,
          `"${r.movedBy.replace(/"/g, '""')}"`,
          `"${r.secondedBy.replace(/"/g, '""')}"`,
          r.voteInFavor.toString(),
          r.voteAgainst.toString(),
          r.voteAbstain.toString()
        ].join(','));
      });
    } else if (activeReportRole === 'PIO') {
      csvRows.push('BAFA OFFICIAL PIO COMMUNITY COMMUNICATIONS REPORT');
      csvRows.push(`Date Generated,${reportDate}`);
      csvRows.push(`PIO,${getOfficerNameByRole('PIO')}`);
      csvRows.push('');
      csvRows.push('ANNOUNCEMENTS LOG');
      csvRows.push('ID,Date Posted,Category,Title,Priority,Posted By');
      announcements.forEach(a => {
        csvRows.push([
          a.id,
          a.datePosted,
          `"${a.category.replace(/"/g, '""')}"`,
          `"${a.title.replace(/"/g, '""')}"`,
          a.priority,
          `"${a.postedBy.replace(/"/g, '""')}"`
        ].join(','));
      });
    } else if (activeReportRole === 'Vice_President') {
      csvRows.push('BAFA OFFICIAL VICE PRESIDENT ADMINISTRATION REPORT');
      csvRows.push(`Date Generated,${reportDate}`);
      csvRows.push(`Vice President,${getOfficerNameByRole('Vice_President')}`);
      csvRows.push('');
      csvRows.push('ADMINISTRATION METRICS');
      csvRows.push(`Registered Members,${members.length}`);
      csvRows.push(`Active Members,${activeMembers.length}`);
      csvRows.push(`Net Fund Balance (PHP),${netBalance.toFixed(2)}`);
      csvRows.push(`Approved Resolutions,${resolutions.filter(r => r.status === 'Approved').length}`);
    } else {
      // PRESIDENT'S CONSOLIDATED EXECUTIVE CSV REPORT
      csvRows.push('BAFA PRESIDENT CONSOLIDATED EXECUTIVE SUMMARY OF ALL OFFICERS REPORTS');
      csvRows.push(`Date Generated,${reportDate}`);
      csvRows.push(`President,${getOfficerNameByRole('President')}`);
      csvRows.push('');
      csvRows.push('1. EXECUTIVE STATE OF THE ASSOCIATION');
      csvRows.push(`Total Registered Farmer Members,${members.length}`);
      csvRows.push(`Active Farmer Members,${activeMembers.length}`);
      csvRows.push(`Net General Cash Fund Balance (PHP),${netBalance.toFixed(2)}`);
      csvRows.push(`LGU Assistance Grant Allocation (PHP),1000000.00`);
      csvRows.push(`Approved Legislative Resolutions,${resolutions.filter(r => r.status === 'Approved').length}`);
      csvRows.push(`Financial Audit Compliance Rate (%),${auditComplianceRate}`);
      csvRows.push('');
      csvRows.push('2. TREASURER FINANCIAL SUMMARY');
      csvRows.push(`Gross Income (PHP),${totalIncome.toFixed(2)}`);
      csvRows.push(`Gross Expenditures (PHP),${totalExpense.toFixed(2)}`);
      csvRows.push(`Net Balance (PHP),${netBalance.toFixed(2)}`);
      csvRows.push('');
      csvRows.push('3. AUDITOR COMPLIANCE SUMMARY');
      csvRows.push(`Total Evaluated Transactions,${transactions.length}`);
      csvRows.push(`Audited Verified OK,${auditedCount}`);
      csvRows.push(`Flagged Discrepancy Items,${flaggedCount}`);
      csvRows.push(`Audit Integrity Rate (%),${auditComplianceRate}`);
      csvRows.push('');
      csvRows.push('4. SECRETARY ROSTER & ASSEMBLY SUMMARY');
      csvRows.push(`Active Members,${activeMembers.length}`);
      csvRows.push(`Inactive Members,${inactiveMembers.length}`);
      csvRows.push(`Passed Resolutions,${resolutions.filter(r => r.status === 'Approved').length}`);
      csvRows.push(`General Assembly Meetings Logged,${meetings.length}`);
      csvRows.push('');
      csvRows.push('5. PUBLIC INFORMATION OFFICER (PIO) SUMMARY');
      csvRows.push(`Total Bulletins Published,${announcements.length}`);
      csvRows.push(`High Priority Advisories,${announcements.filter(a => a.priority === 'High').length}`);
      if (hogRaising) {
        csvRows.push('');
        csvRows.push('6. HOG RAISING IGP LIVELIHOOD SUMMARY');
        csvRows.push(`Total Operating Expenses (PHP),${(hogRaising.expenses || []).reduce((acc, e) => acc + e.amount, 0).toFixed(2)}`);
        csvRows.push(`Active Volunteer Chore Groups,${hogRaising.groups?.length || 0}`);
        csvRows.push(`Total Batch Sales Revenue (PHP),${(hogRaising.sales || []).reduce((acc, s) => acc + s.revenue, 0).toFixed(2)}`);
      }
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvRows.join('\n'));
    const link = document.createElement('a');
    link.setAttribute('href', csvContent);
    link.setAttribute('download', `BAFA_Report_${activeReportRole}_${reportDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-[90] animate-fade-in text-left">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* MODAL HEADER */}
        <div className="p-4 sm:p-5 bg-slate-950 border-b border-slate-800 flex justify-between items-center gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0">
              <FileText className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-black text-white uppercase tracking-wider flex flex-wrap items-center gap-2">
                <span className="truncate">{isPresident ? "President's Executive Summary & Export Center" : `${currentRole.replace('_', ' ')} Official Report Center`}</span>
                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] px-2 py-0.5 rounded-full shrink-0 font-mono">
                  BAFA Tuburan
                </span>
              </h2>
              <p className="text-xs text-slate-400 font-medium truncate">
                {isPresident 
                  ? "Generate and export the consolidated summary of all executive officer reports."
                  : `Generate, export, or print the official ${currentRole.replace('_', ' ')} department report.`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl bg-slate-900 border border-slate-800 transition-all cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="p-4 sm:p-6 space-y-5 overflow-y-auto flex-1">
          {/* ROLE ACCESS BANNER */}
          {!isPresident ? (
            <div className="bg-emerald-950/40 border border-emerald-500/30 p-3.5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                <div className="min-w-0">
                  <span className="font-extrabold text-white block">Opisyal nga Report sa {currentRole.replace('_', ' ')}</span>
                  <p className="text-[11px] text-slate-300">
                    Isip {currentRole.replace('_', ' ')}, maka-export ka ra sa opisyal nga report sa imong sarang nga departamento. Ang Presidente lamang ang maka-export sa consolidated summary sa tanang opisyal.
                  </p>
                </div>
              </div>
              <span className="bg-emerald-500/20 text-emerald-300 font-mono text-[10px] px-2.5 py-1 rounded-lg border border-emerald-500/40 font-bold shrink-0">
                {currentRole} Report Only
              </span>
            </div>
          ) : (
            <div className="bg-purple-950/40 border border-purple-500/30 p-3.5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <FileText className="w-5 h-5 text-purple-400 shrink-0" />
                <div className="min-w-0">
                  <span className="font-extrabold text-white block">President's Executive Summary Access</span>
                  <p className="text-[11px] text-slate-300">
                    Gi-export: Summary sa tanang report gikan sa mga Executive Officers (Treasurer, Auditor, Secretary, PIO, ug Hog IGP).
                  </p>
                </div>
              </div>
              <span className="bg-purple-500/20 text-purple-300 font-mono text-[10px] px-2.5 py-1 rounded-lg border border-purple-500/40 font-bold shrink-0">
                President Mode
              </span>
            </div>
          )}

          {/* REPORT TYPE SELECTOR FOR PRESIDENT */}
          {isPresident && (
            <div className="space-y-2">
              <label className="block text-xs font-black text-slate-400 uppercase tracking-wider">
                Select View / Report Scope:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {[
                  { role: 'President' as OfficerRole, label: 'Consolidated Summary', icon: FileText, color: 'text-purple-400' },
                  { role: 'Treasurer' as OfficerRole, label: 'Treasurer', icon: Coins, color: 'text-amber-400' },
                  { role: 'Auditor' as OfficerRole, label: 'Auditor', icon: ShieldCheck, color: 'text-emerald-400' },
                  { role: 'Secretary' as OfficerRole, label: 'Secretary', icon: Users, color: 'text-blue-400' },
                  { role: 'PIO' as OfficerRole, label: 'PIO Board', icon: Megaphone, color: 'text-pink-400' }
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = activeReportRole === item.role;
                  return (
                    <button
                      key={item.role}
                      type="button"
                      onClick={() => setSelectedReportType(item.role)}
                      className={`p-3 rounded-2xl border text-center flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-600/20 border-emerald-500 text-white shadow-md'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${item.color}`} />
                      <span className="text-xs font-extrabold">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* REPORT PREVIEW CARD */}
          <div className="bg-slate-950/80 border border-slate-800 p-5 rounded-2xl space-y-4 text-xs">
            <div className="flex flex-wrap justify-between items-center gap-2 border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider">Official Document Preview</span>
                <h3 className="text-sm font-black text-white mt-0.5">
                  {activeReportRole === 'Treasurer' && "Treasurer's Official Financial & Cash Flow Statement"}
                  {activeReportRole === 'Auditor' && "Auditor's Financial Oversight & Compliance Inspection Report"}
                  {activeReportRole === 'Secretary' && "Secretary's Membership Roster & Legislative Assembly Report"}
                  {activeReportRole === 'President' && "President's Executive Consolidated Summary of All Officer Reports"}
                  {activeReportRole === 'Vice_President' && "Vice President's Administration & Oversight Report"}
                  {activeReportRole === 'PIO' && "Public Information Officer Community Communications Report"}
                </h3>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400">Signing Officer:</span>
                <p className="font-extrabold text-white">{getOfficerNameByRole(activeReportRole)}</p>
              </div>
            </div>

            {/* QUICK PREVIEW METRICS */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
              {activeReportRole === 'Treasurer' && (
                <>
                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Total Income</span>
                    <p className="text-sm font-mono font-bold text-emerald-400">PHP {totalIncome.toLocaleString()}</p>
                  </div>
                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Total Expenses</span>
                    <p className="text-sm font-mono font-bold text-rose-400">PHP {totalExpense.toLocaleString()}</p>
                  </div>
                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Net Fund</span>
                    <p className="text-sm font-mono font-bold text-white">PHP {netBalance.toLocaleString()}</p>
                  </div>
                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Entries</span>
                    <p className="text-sm font-mono font-bold text-slate-200">{transactions.length} Records</p>
                  </div>
                </>
              )}

              {activeReportRole === 'Auditor' && (
                <>
                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Evaluated</span>
                    <p className="text-sm font-mono font-bold text-slate-200">{transactions.length} Tx</p>
                  </div>
                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Audited OK</span>
                    <p className="text-sm font-mono font-bold text-emerald-400">{auditedCount} Verified</p>
                  </div>
                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Flagged</span>
                    <p className="text-sm font-mono font-bold text-rose-400">{flaggedCount} Discrepancies</p>
                  </div>
                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Compliance Rate</span>
                    <p className="text-sm font-mono font-bold text-emerald-400">{auditComplianceRate}%</p>
                  </div>
                </>
              )}

              {activeReportRole === 'Secretary' && (
                <>
                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Active Roster</span>
                    <p className="text-sm font-mono font-bold text-emerald-400">{activeMembers.length} Members</p>
                  </div>
                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Sitios Covered</span>
                    <p className="text-sm font-mono font-bold text-blue-400">{Object.keys(sitioCounts).length} Locations</p>
                  </div>
                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Resolutions</span>
                    <p className="text-sm font-mono font-bold text-white">{resolutions.length} Passed</p>
                  </div>
                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Meetings Logged</span>
                    <p className="text-sm font-mono font-bold text-amber-400">{meetings.length} Sessions</p>
                  </div>
                </>
              )}

              {activeReportRole === 'President' && (
                <>
                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Active Farmers</span>
                    <p className="text-sm font-mono font-bold text-white">{activeMembers.length} / {members.length}</p>
                  </div>
                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Net Fund</span>
                    <p className="text-sm font-mono font-bold text-emerald-400">PHP {netBalance.toLocaleString()}</p>
                  </div>
                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Audit Rate</span>
                    <p className="text-sm font-mono font-bold text-emerald-400">{auditComplianceRate}%</p>
                  </div>
                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Officer Modules</span>
                    <p className="text-sm font-mono font-bold text-purple-400">All 6 Consolidated</p>
                  </div>
                </>
              )}

              {(activeReportRole === 'Vice_President' || activeReportRole === 'PIO') && (
                <>
                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Total Members</span>
                    <p className="text-sm font-mono font-bold text-white">{members.length}</p>
                  </div>
                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">General Fund</span>
                    <p className="text-sm font-mono font-bold text-emerald-400">PHP {netBalance.toLocaleString()}</p>
                  </div>
                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Approved Res.</span>
                    <p className="text-sm font-mono font-bold text-purple-400">{resolutions.filter(r => r.status === 'Approved').length}</p>
                  </div>
                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Bulletins Published</span>
                    <p className="text-sm font-mono font-bold text-pink-400">{announcements.length}</p>
                  </div>
                </>
              )}
            </div>

            {/* CUSTOM REMARKS INPUT */}
            <div className="space-y-1.5 pt-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase">
                Dugang nga Mubo nga Pahayag / Special Remarks (Optional):
              </label>
              <textarea
                rows={2}
                value={customRemarks}
                onChange={(e) => setCustomRemarks(e.target.value)}
                placeholder="e.g., Reports compiled for Tuburan LGU Municipal Agriculture Audit & Annual BAFA General Assembly."
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500 font-sans"
              />
            </div>
          </div>
        </div>

        {/* MODAL FOOTER */}
        <div className="p-4 sm:p-5 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-3 w-full">
          <div className="text-[10px] text-slate-500 font-mono text-center sm:text-left">
            Barangay Alegria Farmers Association • Tuburan, Cebu
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2.5 w-full sm:w-auto">
            {onDownloadBackup && (
              <button
                type="button"
                onClick={onDownloadBackup}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-emerald-500/40 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-200 text-xs font-black transition-all cursor-pointer shadow-sm whitespace-nowrap"
                title="Download formatted JSON backup of all local association data"
              >
                <Download className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Download System Backup</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleExportCSV}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all cursor-pointer shadow-sm whitespace-nowrap"
            >
              <Download className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Export CSV (Excel)</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition-all cursor-pointer shadow-md whitespace-nowrap"
            >
              <Printer className="w-4 h-4 shrink-0" />
              <span>I-print ang Official Report</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

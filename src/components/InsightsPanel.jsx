import React, { useState, useEffect, useRef } from 'react';
import { jsPDF } from 'jspdf';
import { 
  Heart, Activity, FileText, AlertCircle, CheckCircle2, HelpCircle, 
  Clock, ShieldAlert, Copy, Check, FileDown, Send, Pill, Calendar, 
  Stethoscope, AlertTriangle, Search, Filter, Layers, ListChecks, MessageSquare
} from 'lucide-react';

// Simple Markdown parser helper
function SimpleMarkdown({ text }) {
  if (!text) return null;
  const lines = text.split('\n');

  return (
    <div className="markdown-content">
      {lines.map((line, idx) => {
        if (line.startsWith('### ')) {
          return <h4 key={idx} style={{ marginTop: '1rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>{parseLineContent(line.slice(4))}</h4>;
        }
        if (line.startsWith('## ')) {
          return <h3 key={idx} style={{ marginTop: '1.25rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>{parseLineContent(line.slice(3))}</h3>;
        }
        if (line.startsWith('# ')) {
          return <h2 key={idx} style={{ marginTop: '1.5rem', marginBottom: '0.75rem', color: 'var(--text-primary)' }}>{parseLineContent(line.slice(2))}</h2>;
        }
        if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
          return (
            <ul key={idx} style={{ margin: '0.25rem 0 0.25rem 1.25rem' }}>
              <li>{parseLineContent(line.trim().slice(2))}</li>
            </ul>
          );
        }
        if (line.trim() === '') return <div key={idx} style={{ height: '0.5rem' }} />;
        return <p key={idx}>{parseLineContent(line)}</p>;
      })}
    </div>
  );
}

function parseLineContent(text) {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index} style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

export default function InsightsPanel({ reportData, chatSession, isAnalyzing, status, errorMsg }) {
  const [activeTab, setActiveTab] = useState('summary');
  const [copied, setCopied] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);

  const chatBottomRef = useRef(null);

  useEffect(() => {
    if (chatSession) {
      setChatMessages([
        { 
          role: 'assistant', 
          text: "Cardiology clinical summary compiled. You can ask me questions about CAG/PCI details, LVEF trends, medication reconciliation, or diagnostic discrepancies." 
        }
      ]);
    } else {
      setChatMessages([]);
    }
  }, [chatSession, reportData]);

  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isChatLoading, activeTab]);

  if (isAnalyzing) {
    return (
      <div className="insights-panel" style={{ padding: '2rem' }}>
        <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Heart className="logo-icon" size={22} style={{ color: 'var(--color-danger)' }} />
          Compiling Cardiology Clinical Summary...
        </h3>
        <div className="skeleton-loader">
          <div className="skeleton-line title"></div>
          <div className="skeleton-line long"></div>
          <div className="skeleton-line medium"></div>
          <div className="skeleton-line long"></div>
          <div className="skeleton-line short"></div>
          <div style={{ height: '1rem' }}></div>
          <div className="skeleton-line title"></div>
          <div className="skeleton-line long"></div>
          <div className="skeleton-line long"></div>
        </div>
      </div>
    );
  }

  if (status === 'failed') {
    return (
      <div className="insights-panel" style={{ padding: '2rem', justifyContent: 'center', alignItems: 'center', textAlign: 'center', display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ color: 'var(--color-danger)', marginBottom: '1rem' }}>
          <AlertCircle size={48} />
        </div>
        <h3 style={{ marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Cardiology Record Analysis Failed</h3>
        <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '380px', margin: '0 auto 1.5rem auto' }}>
          <code style={{ display: 'block', padding: '0.75rem', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '6px', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', textAlign: 'left', color: '#fca5a5' }}>
            {errorMsg || "An error occurred while processing the cardiology records."}
          </code>
        </div>
        <button className="empty-state-action-btn" onClick={() => window.location.reload()}>
          Reload App & Retry
        </button>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="insights-panel" style={{ padding: '2rem', justifyContent: 'center', alignItems: 'center', color: 'var(--text-muted)' }}>
        <p>No document active. Upload cardiology records to generate clinical summary.</p>
      </div>
    );
  }

  const {
    metadata = {},
    clinicalSnapshot = '',
    cardiologistQuickView = [],
    establishedMajorDiagnoses = {},
    cardiovascularHistory = [],
    clinicalTimeline = [],
    investigations = {},
    laboratoryData = [],
    currentMedications = [],
    riskFactors = [],
    nonCardiacConditions = [],
    allergies = [],
    conflictsAndDiscrepancies = [],
    missingInformation = []
  } = reportData;

  const stronglySupported = establishedMajorDiagnoses.stronglySupported || [];
  const previouslyDocumented = establishedMajorDiagnoses.previouslyDocumented || [];
  const uncertainUnsupported = establishedMajorDiagnoses.uncertainUnsupported || [];

  const ecgList = investigations.ecg || [];
  const echoList = investigations.echo || [];
  const lvefTrend = investigations.lvefTrend || '';
  const cagPciList = investigations.cagPci || [];
  const otherCardiacTests = investigations.otherCardiacTests || [];

  const generateFullTextReport = () => {
    return `
===========================================================
CARDIOLOGY CLINICAL SUMMARY
===========================================================
Patient: ${metadata.patientName || 'N/A'} | Age/Gender: ${metadata.patientAge || 'N/A'} / ${metadata.patientGender || 'N/A'}
Date: ${metadata.documentDate || 'N/A'} | Facility: ${metadata.facilityName || 'N/A'}
Document Type: ${metadata.documentType || 'N/A'}

-----------------------------------------------------------
1. CLINICAL SNAPSHOT
-----------------------------------------------------------
${clinicalSnapshot || 'Not available'}

-----------------------------------------------------------
2. CARDIOLOGIST QUICK VIEW
-----------------------------------------------------------
${cardiologistQuickView.map(b => `* ${b}`).join('\n') || 'None'}

-----------------------------------------------------------
3. ESTABLISHED MAJOR DIAGNOSES
-----------------------------------------------------------
[Established / Strongly Supported]
${stronglySupported.map(d => `* ${d}`).join('\n') || 'None'}

[Previously Documented / Needs Confirmation]
${previouslyDocumented.map(d => `* ${d}`).join('\n') || 'None'}

[Uncertain / Unsupported]
${uncertainUnsupported.map(d => `* ${d}`).join('\n') || 'None'}

-----------------------------------------------------------
4. CARDIOVASCULAR HISTORY
-----------------------------------------------------------
${cardiovascularHistory.map(h => `* ${h}`).join('\n') || 'Not available'}

-----------------------------------------------------------
5. CLINICAL TIMELINE
-----------------------------------------------------------
${clinicalTimeline.map(t => `[${t.period}]\n${t.events.map(e => `  - ${e}`).join('\n')}`).join('\n\n') || 'None'}

-----------------------------------------------------------
6. IMPORTANT INVESTIGATIONS
-----------------------------------------------------------
Echocardiography:
LVEF Trend: ${lvefTrend || 'N/A'}
${echoList.map(e => `* Date: ${e.date} | LVEF: ${e.lvef} | RWMA: ${e.rwma} | Valve: ${e.valveDisease} | PHTN: ${e.phtn}`).join('\n')}

Coronary Angiography (CAG) / PCI:
${cagPciList.map(c => `* Date: ${c.date} | LM: ${c.lm} | LAD: ${c.lad} | LCX: ${c.lcx} | RCA: ${c.rca} | PCI: ${c.pciDetails}`).join('\n')}

ECG:
${ecgList.map(e => `* Date: ${e.date} | Rhythm: ${e.rhythm} | Findings: ${e.findings}`).join('\n')}

-----------------------------------------------------------
7. IMPORTANT LABORATORY DATA
-----------------------------------------------------------
${laboratoryData.map(l => `* ${l.parameter}: ${l.latestValue} (Trend: ${l.trend || 'N/A'})`).join('\n') || 'None'}

-----------------------------------------------------------
8. MOST LIKELY CURRENT MEDICATIONS
-----------------------------------------------------------
${currentMedications.map(m => `* ${m.medicine} | Dose: ${m.dose} | Freq: ${m.frequency} | Indication: ${m.likelyIndication} | Ref: ${m.evidence}`).join('\n') || 'None'}

-----------------------------------------------------------
9. CARDIOVASCULAR RISK FACTORS
-----------------------------------------------------------
${riskFactors.map(r => `* ${r.factor}: ${r.status}`).join('\n') || 'None'}

-----------------------------------------------------------
10. NON-CARDIAC CONDITIONS & ALLERGIES
-----------------------------------------------------------
Non-Cardiac: ${nonCardiacConditions.join('; ') || 'None'}
Allergies: ${allergies.join('; ') || 'No reliable allergy information available'}

-----------------------------------------------------------
11. CONFLICTS & DISCREPANCIES
-----------------------------------------------------------
${conflictsAndDiscrepancies.map(c => `* ${c}`).join('\n') || 'No major conflicts identified'}

-----------------------------------------------------------
12. IMPORTANT MISSING INFORMATION
-----------------------------------------------------------
${missingInformation.map(m => `* ${m}`).join('\n') || 'None'}
    `.trim();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generateFullTextReport());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 40;
    const maxLineWidth = pageWidth - margin * 2;
    let y = 40;

    const checkPageBreak = (neededHeight = 25) => {
      if (y + neededHeight > pageHeight - 45) {
        doc.addPage();
        y = 45;
      }
    };

    // Header Banner
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, pageWidth, 75, 'F');

    doc.setTextColor(244, 63, 94);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('AegisScan Cardiology EHR Summary', margin, 32);

    doc.setTextColor(148, 163, 184);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Patient: ${metadata.patientName || 'N/A'}  |  Age/Gender: ${metadata.patientAge || 'N/A'} / ${metadata.patientGender || 'N/A'}  |  Date: ${metadata.documentDate || 'N/A'}`, margin, 52);

    y = 95;

    // Helper to print section header
    const printSectionHeader = (title, color = [6, 182, 212]) => {
      checkPageBreak(32);
      doc.setFillColor(color[0], color[1], color[2]);
      doc.rect(margin, y, 4, 15, 'F');
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text(title, margin + 10, y + 12);
      y += 24;
    };

    // Helper to print lines with auto wrap
    const printParagraph = (text, fontSize = 9, isBold = false, textColor = [51, 65, 85]) => {
      if (!text) return;
      doc.setFont('helvetica', isBold ? 'bold' : 'normal');
      doc.setFontSize(fontSize);
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);
      const lines = doc.splitTextToSize(text, maxLineWidth);
      checkPageBreak(lines.length * (fontSize + 3) + 4);
      doc.text(lines, margin, y);
      y += lines.length * (fontSize + 3) + 4;
    };

    // 1. CLINICAL SNAPSHOT
    printSectionHeader('1. CLINICAL SNAPSHOT', [244, 63, 94]);
    printParagraph(clinicalSnapshot, 10, true, [15, 23, 42]);
    y += 6;

    // 2. CARDIOLOGIST QUICK VIEW
    if (cardiologistQuickView.length > 0) {
      printSectionHeader('2. CARDIOLOGIST QUICK VIEW (30-60s Consult Summary)', [6, 182, 212]);
      cardiologistQuickView.forEach(bullet => {
        printParagraph(`• ${bullet}`, 9, false, [30, 41, 59]);
      });
      y += 6;
    }

    // 3. ESTABLISHED MAJOR DIAGNOSES
    printSectionHeader('3. ESTABLISHED MAJOR DIAGNOSES', [99, 102, 241]);
    if (stronglySupported.length > 0) {
      printParagraph('[Established / Strongly Supported]', 9, true, [16, 185, 129]);
      stronglySupported.forEach(d => printParagraph(`• ${d}`, 9, false, [30, 41, 59]));
    }
    if (previouslyDocumented.length > 0) {
      printParagraph('[Previously Documented / Needs Confirmation]', 9, true, [245, 158, 11]);
      previouslyDocumented.forEach(d => printParagraph(`• ${d}`, 9, false, [71, 85, 105]));
    }
    if (uncertainUnsupported.length > 0) {
      printParagraph('[Uncertain / Unsupported]', 9, true, [100, 116, 139]);
      uncertainUnsupported.forEach(d => printParagraph(`• ${d}`, 9, false, [100, 116, 139]));
    }
    y += 6;

    // 4. MOST LIKELY CURRENT MEDICATIONS
    if (currentMedications.length > 0) {
      printSectionHeader('4. MOST LIKELY CURRENT MEDICATIONS', [16, 185, 129]);
      currentMedications.forEach(med => {
        printParagraph(`• ${med.medicine} (${med.dose || ''} ${med.frequency || ''}) - Indication: ${med.likelyIndication || 'N/A'} [Ref: ${med.evidence || 'N/A'}]`, 9, false, [30, 41, 59]);
      });
      y += 6;
    }

    // 5. CARDIOVASCULAR RISK FACTORS
    if (riskFactors.length > 0) {
      printSectionHeader('5. CARDIOVASCULAR RISK FACTORS', [6, 182, 212]);
      const rfText = riskFactors.map(rf => `${rf.factor}: ${rf.status}`).join('  |  ');
      printParagraph(rfText, 9, false, [51, 65, 85]);
      y += 6;
    }

    // 6. CARDIOVASCULAR HISTORY
    if (cardiovascularHistory.length > 0) {
      printSectionHeader('6. CARDIOVASCULAR HISTORY', [244, 63, 94]);
      cardiovascularHistory.forEach(h => printParagraph(`• ${h}`, 9, false, [30, 41, 59]));
      y += 6;
    }

    // 7. CLINICAL TIMELINE
    if (clinicalTimeline.length > 0) {
      printSectionHeader('7. CLINICAL TIMELINE', [6, 182, 212]);
      clinicalTimeline.forEach(t => {
        printParagraph(`[${t.period}]`, 9, true, [6, 182, 212]);
        t.events.forEach(e => printParagraph(`   - ${e}`, 8.5, false, [51, 65, 85]));
      });
      y += 6;
    }

    // 8. IMPORTANT INVESTIGATIONS
    printSectionHeader('8. IMPORTANT INVESTIGATIONS (Echo, CAG/PCI, ECG)', [99, 102, 241]);
    if (lvefTrend) printParagraph(`LVEF Trend: ${lvefTrend}`, 9.5, true, [15, 23, 42]);
    echoList.forEach(e => printParagraph(`• Echo (${e.date}): LVEF ${e.lvef} | RWMA: ${e.rwma} | Valve: ${e.valveDisease}`, 8.5, false, [51, 65, 85]));
    cagPciList.forEach(c => printParagraph(`• CAG (${c.date}): LM:${c.lm}, LAD:${c.lad}, LCX:${c.lcx}, RCA:${c.rca} | PCI: ${c.pciDetails}`, 8.5, false, [51, 65, 85]));
    ecgList.forEach(e => printParagraph(`• ECG (${e.date}): ${e.rhythm} - ${e.findings}`, 8.5, false, [51, 65, 85]));
    y += 6;

    // 9. IMPORTANT LABORATORY DATA
    if (laboratoryData.length > 0) {
      printSectionHeader('9. IMPORTANT LABORATORY DATA & TRENDS', [6, 182, 212]);
      laboratoryData.forEach(l => printParagraph(`• ${l.parameter}: ${l.latestValue} (Trend: ${l.trend || 'N/A'})`, 8.5, false, [51, 65, 85]));
      y += 6;
    }

    // 10. CONFLICTS & MISSING INFORMATION
    if (conflictsAndDiscrepancies.length > 0 || missingInformation.length > 0) {
      printSectionHeader('10. CONFLICTS & MISSING INFORMATION', [245, 158, 11]);
      conflictsAndDiscrepancies.forEach(c => printParagraph(`• Conflict: ${c}`, 8.5, false, [180, 83, 9]));
      missingInformation.forEach(m => printParagraph(`• Missing: ${m}`, 8.5, false, [225, 29, 72]));
      y += 6;
    }

    // Page Numbers Footer
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(`AegisScan Cardiology AI Report - Page ${i} of ${totalPages}`, pageWidth - margin - 140, pageHeight - 15);
    }

    doc.save(`Cardiology_Full_Summary_${(metadata.patientName || "Patient").replace(/\s+/g, "_")}.pdf`);
  };

  const handleExportSinglePagePDF = () => {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth(); // 595.28 pt
    const pageHeight = doc.internal.pageSize.getHeight(); // 841.89 pt
    const margin = 28;
    const maxLineWidth = pageWidth - margin * 2;
    let y = 25;

    // Header Banner (Dark Navy)
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, pageWidth, 50, 'F');

    doc.setTextColor(244, 63, 94);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('AegisScan Cardiology - 1-Page Executive Consult Summary', margin, 22);

    doc.setTextColor(148, 163, 184);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(`Patient: ${metadata.patientName || 'N/A'}  |  Age/Gender: ${metadata.patientAge || 'N/A'} / ${metadata.patientGender || 'N/A'}  |  Date: ${metadata.documentDate || 'N/A'}`, margin, 38);

    y = 62;

    const printHeader = (title, color = [6, 182, 212]) => {
      doc.setFillColor(color[0], color[1], color[2]);
      doc.rect(margin, y, 3, 10, 'F');
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.text(title, margin + 7, y + 8);
      y += 14;
    };

    const printText = (text, fontSize = 8, isBold = false, color = [30, 41, 59]) => {
      if (!text) return;
      doc.setFont('helvetica', isBold ? 'bold' : 'normal');
      doc.setFontSize(fontSize);
      doc.setTextColor(color[0], color[1], color[2]);
      const lines = doc.splitTextToSize(text, maxLineWidth);
      doc.text(lines, margin, y);
      y += lines.length * (fontSize + 2) + 2;
    };

    // 1. Clinical Snapshot
    printHeader('1. CLINICAL SNAPSHOT', [244, 63, 94]);
    printText(clinicalSnapshot, 8.5, true, [15, 23, 42]);
    y += 2;

    // 2. Cardiologist Quick View (max 5 key bullets)
    if (cardiologistQuickView.length > 0) {
      printHeader('2. CARDIOLOGIST QUICK CONSULT VIEW (30-60s Review)', [6, 182, 212]);
      cardiologistQuickView.slice(0, 5).forEach(bullet => {
        printText(`• ${bullet}`, 8, false, [30, 41, 59]);
      });
      y += 2;
    }

    // 3. Established Major Diagnoses
    printHeader('3. MAJOR DIAGNOSES & EVIDENCE CLASSIFICATION', [99, 102, 241]);
    if (stronglySupported.length > 0) {
      printText(`Strongly Supported: ${stronglySupported.join('; ')}`, 8, false, [16, 185, 129]);
    }
    if (previouslyDocumented.length > 0) {
      printText(`Needs Confirmation: ${previouslyDocumented.join('; ')}`, 8, false, [245, 158, 11]);
    }
    if (uncertainUnsupported.length > 0) {
      printText(`Uncertain / Unsupported: ${uncertainUnsupported.join('; ')}`, 8, false, [100, 116, 139]);
    }
    y += 2;

    // 4. Most Likely Current Medications
    if (currentMedications.length > 0) {
      printHeader('4. CURRENT MEDICATIONS', [16, 185, 129]);
      const medText = currentMedications.slice(0, 6).map(m => `${m.medicine} ${m.dose || ''}`).join('  |  ');
      printText(medText, 8, false, [30, 41, 59]);
      y += 2;
    }

    // 5. Investigations & LVEF Trend
    printHeader('5. ECHO LVEF TREND & CAG / PCI SUMMARY', [244, 63, 94]);
    if (lvefTrend) printText(`LVEF Trend: ${lvefTrend}`, 8.5, true, [15, 23, 42]);
    cagPciList.slice(0, 2).forEach(c => {
      printText(`CAG (${c.date}): LM:${c.lm}, LAD:${c.lad}, LCX:${c.lcx}, RCA:${c.rca} | PCI: ${c.pciDetails}`, 7.5, false, [51, 65, 85]);
    });
    y += 2;

    // 6. Cardiovascular Risk Factors
    if (riskFactors.length > 0) {
      printHeader('6. RISK FACTORS', [6, 182, 212]);
      const rfText = riskFactors.map(rf => `${rf.factor}: ${rf.status}`).join(' | ');
      printText(rfText, 7.5, false, [51, 65, 85]);
      y += 2;
    }

    // 7. Conflicts & Critical Missing Info
    if (conflictsAndDiscrepancies.length > 0 || missingInformation.length > 0) {
      printHeader('7. CONFLICTS & MISSING INFORMATION', [245, 158, 11]);
      if (conflictsAndDiscrepancies.length > 0) printText(`Conflicts: ${conflictsAndDiscrepancies.slice(0, 2).join('; ')}`, 7.5, false, [180, 83, 9]);
      if (missingInformation.length > 0) printText(`Missing: ${missingInformation.slice(0, 3).join('; ')}`, 7.5, false, [225, 29, 72]);
    }

    // Footer
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text('AegisScan Cardiology AI - 1-Page Executive Consult Summary (Confidential)', margin, pageHeight - 12);

    doc.save(`Cardiology_1Page_Summary_${(metadata.patientName || "Patient").replace(/\s+/g, "_")}.pdf`);
  };

  const handleSendMessage = async (textToSend) => {
    const messageText = textToSend || userInput;
    if (!messageText.trim() || !chatSession || isChatLoading) return;

    setChatMessages(prev => [...prev, { role: 'user', text: messageText }]);
    if (!textToSend) setUserInput('');
    setIsChatLoading(true);

    try {
      const response = await chatSession.sendMessage(messageText);
      setChatMessages(prev => [...prev, { role: 'assistant', text: response.response.text() }]);
    } catch (err) {
      console.error("Chat error:", err);
      setChatMessages(prev => [...prev, { role: 'assistant', text: "Error communicating with AI assistant." }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const cardiologistPrompts = [
    "What is the CAG/PCI anatomical summary?",
    "Show LVEF trend over time",
    "List potential drug interactions or therapeutic duplicates",
    "What key records are missing for decision making?"
  ];

  return (
    <div className="insights-panel">
      {/* Tab Header Navigation */}
      <div className="insights-header-tabs" role="tablist">
        <button 
          className={`tab-btn ${activeTab === 'summary' ? 'active' : ''}`}
          onClick={() => setActiveTab('summary')}
          role="tab"
          aria-selected={activeTab === 'summary'}
        >
          <Heart size={16} style={{ color: 'var(--color-danger)' }} />
          Cardiology Summary
        </button>
        <button 
          className={`tab-btn ${activeTab === 'investigations' ? 'active' : ''}`}
          onClick={() => setActiveTab('investigations')}
          role="tab"
          aria-selected={activeTab === 'investigations'}
        >
          <Activity size={16} />
          Investigations & Labs
        </button>
        <button 
          className={`tab-btn ${activeTab === 'audits' ? 'active' : ''}`}
          onClick={() => setActiveTab('audits')}
          role="tab"
          aria-selected={activeTab === 'audits'}
        >
          <AlertTriangle size={16} />
          Conflicts & Missing Data ({conflictsAndDiscrepancies.length + missingInformation.length})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'chat' ? 'active' : ''}`}
          onClick={() => setActiveTab('chat')}
          role="tab"
          aria-selected={activeTab === 'chat'}
        >
          <MessageSquare size={16} />
          Cardiology AI Consult
        </button>
      </div>

      {/* Tab Body Contents */}
      <div className="insights-body">

        {/* TAB 1: CARDIOLOGY SUMMARY */}
        {activeTab === 'summary' && (
          <div className="summary-container">

            {/* 1. CLINICAL SNAPSHOT */}
            <div className="summary-card" style={{ borderLeft: '4px solid var(--color-danger)', background: 'rgba(244, 63, 94, 0.03)' }}>
              <div className="summary-card-header" style={{ color: 'var(--color-danger)' }}>
                <Heart size={18} />
                <span>1. CLINICAL SNAPSHOT</span>
              </div>
              <p style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)', lineHeight: '1.5' }}>
                {clinicalSnapshot || 'No clinical snapshot generated.'}
              </p>
            </div>

            {/* CARDIOLOGIST QUICK VIEW BOX */}
            {cardiologistQuickView.length > 0 && (
              <div className="summary-card" style={{ border: '1.5px solid var(--color-primary)', background: 'rgba(6, 182, 212, 0.04)' }}>
                <div className="summary-card-header" style={{ color: 'var(--color-primary)' }}>
                  <ListChecks size={18} />
                  <span>CARDIOLOGIST QUICK VIEW (30-60s Consult Summary)</span>
                </div>
                <ul style={{ paddingLeft: '1.25rem', color: 'var(--text-primary)', fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {cardiologistQuickView.map((bullet, idx) => (
                    <li key={idx} style={{ fontWeight: '500' }}>{parseLineContent(bullet)}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* 2. ESTABLISHED MAJOR DIAGNOSES */}
            <div className="summary-card">
              <div className="summary-card-header" style={{ color: 'var(--color-accent)' }}>
                <Stethoscope size={18} />
                <span>2. ESTABLISHED MAJOR DIAGNOSES</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Strongly Supported */}
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--color-success)', letterSpacing: '0.5px', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <CheckCircle2 size={14} />
                    Established / Strongly Supported
                  </div>
                  {stronglySupported.length > 0 ? (
                    <ul style={{ paddingLeft: '1.2rem', fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                      {stronglySupported.map((item, i) => <li key={i}>{parseLineContent(item)}</li>)}
                    </ul>
                  ) : <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>None documented</div>}
                </div>

                {/* Previously Documented */}
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--color-warning)', letterSpacing: '0.5px', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Clock size={14} />
                    Previously Documented / Needs Confirmation
                  </div>
                  {previouslyDocumented.length > 0 ? (
                    <ul style={{ paddingLeft: '1.2rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                      {previouslyDocumented.map((item, i) => <li key={i}>{parseLineContent(item)}</li>)}
                    </ul>
                  ) : <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>None documented</div>}
                </div>

                {/* Uncertain / Unsupported */}
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.5px', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <HelpCircle size={14} />
                    Uncertain / Unsupported
                  </div>
                  {uncertainUnsupported.length > 0 ? (
                    <ul style={{ paddingLeft: '1.2rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                      {uncertainUnsupported.map((item, i) => <li key={i}>{parseLineContent(item)}</li>)}
                    </ul>
                  ) : <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>None documented</div>}
                </div>
              </div>
            </div>

            {/* 7. MOST LIKELY CURRENT MEDICATIONS */}
            {currentMedications.length > 0 && (
              <div className="summary-card" style={{ padding: '1rem 0' }}>
                <div className="summary-card-header" style={{ color: 'var(--color-success)', padding: '0 1.25rem 0.5rem 1.25rem' }}>
                  <Pill size={18} />
                  <span>7. MOST LIKELY CURRENT MEDICATIONS</span>
                </div>
                <div style={{ overflowX: 'auto', width: '100%' }}>
                  <table className="medical-table">
                    <thead>
                      <tr>
                        <th>Medicine Name</th>
                        <th>Dose</th>
                        <th>Frequency</th>
                        <th>Likely Indication</th>
                        <th>Evidence / Ref</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentMedications.map((med, idx) => (
                        <tr key={idx}>
                          <td style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{med.medicine}</td>
                          <td style={{ fontFamily: 'var(--font-mono)' }}>{med.dose || '-'}</td>
                          <td>{med.frequency || '-'}</td>
                          <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{med.likelyIndication || '-'}</td>
                          <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{med.evidence || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 8. CARDIOVASCULAR RISK FACTORS */}
            {riskFactors.length > 0 && (
              <div className="summary-card">
                <div className="summary-card-header" style={{ color: 'var(--color-primary)' }}>
                  <ShieldAlert size={18} />
                  <span>8. CARDIOVASCULAR RISK FACTORS</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
                  {riskFactors.map((rf, idx) => (
                    <div key={idx} style={{ background: 'rgba(255,255,255,0.02)', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{rf.factor}</span>
                      <span className={`status-pill ${rf.status === 'Present' ? 'high' : rf.status === 'Absent' ? 'normal' : 'low'}`}>
                        {rf.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 3. CARDIOVASCULAR HISTORY */}
            {cardiovascularHistory.length > 0 && (
              <div className="summary-card">
                <div className="summary-card-header" style={{ color: 'var(--color-danger)' }}>
                  <Heart size={18} />
                  <span>3. CARDIOVASCULAR HISTORY</span>
                </div>
                <ul style={{ paddingLeft: '1.25rem', color: 'var(--text-primary)', fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {cardiovascularHistory.map((hist, idx) => (
                    <li key={idx}>{parseLineContent(hist)}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* 4. CLINICAL TIMELINE */}
            {clinicalTimeline.length > 0 && (
              <div className="summary-card">
                <div className="summary-card-header" style={{ color: 'var(--color-primary)' }}>
                  <Calendar size={18} />
                  <span>4. CLINICAL TIMELINE</span>
                </div>
                <div className="timeline-container">
                  {clinicalTimeline.map((item, idx) => (
                    <div key={idx} className="timeline-item">
                      <div className="timeline-badge-date">{item.period}</div>
                      <div className="timeline-content-card">
                        <ul style={{ paddingLeft: '1rem', margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          {item.events.map((ev, i) => <li key={i}>{parseLineContent(ev)}</li>)}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="summary-export-bar">
              <button className="export-btn" onClick={handleCopy}>
                {copied ? <Check size={15} style={{ color: 'var(--color-success)' }} /> : <Copy size={15} />}
                <span>{copied ? 'Copied' : 'Copy Text'}</span>
              </button>
              <button className="export-btn" onClick={handleExportSinglePagePDF} style={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)', background: 'rgba(6, 182, 212, 0.08)' }}>
                <FileDown size={15} />
                <span>Export 1-Page PDF</span>
              </button>
              <button className="export-btn primary" onClick={handleExportPDF}>
                <FileDown size={15} />
                <span>Export Detailed PDF</span>
              </button>
            </div>

          </div>
        )}

        {/* TAB 2: INVESTIGATIONS & LABS */}
        {activeTab === 'investigations' && (
          <div className="summary-container">

            {/* LVEF Trend Banner */}
            {lvefTrend && (
              <div className="summary-card" style={{ borderLeft: '4px solid var(--color-primary)', background: 'rgba(6, 182, 212, 0.04)' }}>
                <div className="summary-card-header" style={{ color: 'var(--color-primary)' }}>
                  <Activity size={18} />
                  <span>ECHO LVEF TREND</span>
                </div>
                <p style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-primary)' }}>{lvefTrend}</p>
              </div>
            )}

            {/* ECHOCARDIOGRAPHY */}
            {echoList.length > 0 && (
              <div className="summary-card">
                <div className="summary-card-header" style={{ color: 'var(--color-accent)' }}>
                  <Activity size={18} />
                  <span>ECHOCARDIOGRAPHY REPORTS</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {echoList.map((echo, idx) => (
                    <div key={idx} style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.875rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.35rem' }}>
                        <span style={{ fontWeight: '700', color: 'var(--color-primary)', fontSize: '0.85rem' }}>Date: {echo.date}</span>
                        <span style={{ fontWeight: '700', color: 'var(--color-danger)', fontSize: '0.85rem' }}>LVEF: {echo.lvef}</span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        <div><strong>RWMA:</strong> {echo.rwma || 'None'}</div>
                        <div><strong>Valves:</strong> {echo.valveDisease || 'Normal'}</div>
                        <div><strong>PHTN:</strong> {echo.phtn || 'None'}</div>
                        <div><strong>Other:</strong> {echo.otherFindings || 'None'}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CAG / PCI */}
            {cagPciList.length > 0 && (
              <div className="summary-card">
                <div className="summary-card-header" style={{ color: 'var(--color-danger)' }}>
                  <Heart size={18} />
                  <span>CORONARY ANGIOGRAPHY (CAG) & PCI</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                  {cagPciList.map((cag, idx) => (
                    <div key={idx} style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1rem' }}>
                      <div style={{ fontWeight: '700', color: 'var(--color-danger)', marginBottom: '0.5rem', fontSize: '0.9rem' }}>CAG Date: {cag.date}</div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', marginBottom: '0.75rem', fontSize: '0.8rem', background: 'rgba(0,0,0,0.2)', padding: '0.5rem', borderRadius: '6px' }}>
                        <div><strong>LM:</strong> {cag.lm}</div>
                        <div><strong>LAD:</strong> {cag.lad}</div>
                        <div><strong>LCX:</strong> {cag.lcx}</div>
                        <div><strong>RCA:</strong> {cag.rca}</div>
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}><strong>PCI Performed:</strong> {cag.pciDetails || 'None'}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}><strong>Residual Disease:</strong> {cag.residualDisease || 'None documented'}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ECG */}
            {ecgList.length > 0 && (
              <div className="summary-card">
                <div className="summary-card-header" style={{ color: 'var(--color-warning)' }}>
                  <Activity size={18} />
                  <span>ECG FINDINGS</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {ecgList.map((ecg, idx) => (
                    <div key={idx} style={{ padding: '0.5rem 0.75rem', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '0.85rem' }}>
                      <span style={{ color: 'var(--color-primary)', fontWeight: '700', marginRight: '0.75rem' }}>{ecg.date}:</span>
                      <span style={{ color: 'var(--text-primary)', fontWeight: '600', marginRight: '0.75rem' }}>{ecg.rhythm}</span>
                      <span style={{ color: 'var(--text-secondary)' }}>{ecg.findings}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 6. IMPORTANT LABORATORY DATA */}
            {laboratoryData.length > 0 && (
              <div className="summary-card" style={{ padding: '1rem 0' }}>
                <div className="summary-card-header" style={{ color: 'var(--color-primary)', padding: '0 1.25rem 0.5rem 1.25rem' }}>
                  <FileText size={18} />
                  <span>6. IMPORTANT LABORATORY DATA & TRENDS</span>
                </div>
                <div style={{ overflowX: 'auto', width: '100%' }}>
                  <table className="medical-table">
                    <thead>
                      <tr>
                        <th>Parameter</th>
                        <th>Latest Value</th>
                        <th>Historical Trend</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {laboratoryData.map((lab, idx) => (
                        <tr key={idx}>
                          <td style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{lab.parameter}</td>
                          <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-primary)', fontWeight: '600' }}>{lab.latestValue}</td>
                          <td style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{lab.trend || 'N/A'}</td>
                          <td>
                            <span className={`status-pill ${lab.isAbnormal ? 'high' : 'normal'}`}>
                              {lab.isAbnormal ? 'Abnormal' : 'Normal'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>
        )}

        {/* TAB 3: CONFLICTS & MISSING DATA */}
        {activeTab === 'audits' && (
          <div className="summary-container">

            {/* CONFLICTS AND DISCREPANCIES */}
            <div className="summary-card" style={{ borderLeft: '4px solid var(--color-warning)', background: 'rgba(245, 158, 11, 0.03)' }}>
              <div className="summary-card-header" style={{ color: 'var(--color-warning)' }}>
                <AlertTriangle size={18} />
                <span>11. CONFLICTS AND DISCREPANCIES</span>
              </div>
              {conflictsAndDiscrepancies.length > 0 ? (
                <ul style={{ paddingLeft: '1.25rem', color: 'var(--text-primary)', fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {conflictsAndDiscrepancies.map((conf, idx) => (
                    <li key={idx}>{parseLineContent(conf)}</li>
                  ))}
                </ul>
              ) : (
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>No major conflicts identified in supplied records.</p>
              )}
            </div>

            {/* IMPORTANT MISSING INFORMATION */}
            <div className="summary-card" style={{ borderLeft: '4px solid var(--color-danger)', background: 'rgba(244, 63, 94, 0.03)' }}>
              <div className="summary-card-header" style={{ color: 'var(--color-danger)' }}>
                <AlertCircle size={18} />
                <span>12. IMPORTANT MISSING INFORMATION</span>
              </div>
              {missingInformation.length > 0 ? (
                <ul style={{ paddingLeft: '1.25rem', color: 'var(--text-primary)', fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {missingInformation.map((miss, idx) => (
                    <li key={idx}>{parseLineContent(miss)}</li>
                  ))}
                </ul>
              ) : (
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>No critical diagnostic data missing.</p>
              )}
            </div>

            {/* NON-CARDIAC CONDITIONS */}
            <div className="summary-card">
              <div className="summary-card-header" style={{ color: 'var(--color-accent)' }}>
                <Stethoscope size={18} />
                <span>9. IMPORTANT NON-CARDIAC CONDITIONS</span>
              </div>
              {nonCardiacConditions.length > 0 ? (
                <ul style={{ paddingLeft: '1.25rem', color: 'var(--text-primary)', fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {nonCardiacConditions.map((nc, idx) => <li key={idx}>{parseLineContent(nc)}</li>)}
                </ul>
              ) : (
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>None documented.</p>
              )}
            </div>

            {/* ALLERGIES */}
            <div className="summary-card">
              <div className="summary-card-header" style={{ color: 'var(--color-warning)' }}>
                <ShieldAlert size={18} />
                <span>10. ALLERGY / ADVERSE DRUG REACTION</span>
              </div>
              {allergies.length > 0 ? (
                <ul style={{ paddingLeft: '1.25rem', color: 'var(--text-primary)', fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {allergies.map((al, idx) => <li key={idx}>{parseLineContent(al)}</li>)}
                </ul>
              ) : (
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>No reliable allergy information available in supplied records.</p>
              )}
            </div>

          </div>
        )}

        {/* TAB 4: CARDIOLOGY AI CONSULT CHAT */}
        {activeTab === 'chat' && (
          <div className="chat-container">
            <div className="chat-history">
              {chatMessages.map((msg, index) => (
                <div key={index} className={`chat-message ${msg.role === 'user' ? 'user' : 'assistant'}`}>
                  <span className="chat-sender">{msg.role === 'user' ? 'Cardiologist' : 'Cardiology AI'}</span>
                  <div className="chat-bubble">
                    <SimpleMarkdown text={msg.text} />
                  </div>
                </div>
              ))}

              {isChatLoading && (
                <div className="chat-message assistant">
                  <span className="chat-sender">Cardiology AI</span>
                  <div className="chat-bubble" style={{ padding: '0.75rem 1rem' }}>
                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center', height: '14px' }}>
                      <div className="status-dot active" style={{ animation: 'pulse-slow 1s infinite', width: '6px', height: '6px' }}></div>
                      <div className="status-dot active" style={{ animation: 'pulse-slow 1s infinite 0.2s', width: '6px', height: '6px' }}></div>
                      <div className="status-dot active" style={{ animation: 'pulse-slow 1s infinite 0.4s', width: '6px', height: '6px' }}></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Suggestion Chips */}
            <div className="chat-suggestions">
              {cardiologistPrompts.map((s, idx) => (
                <button
                  key={idx}
                  className="suggest-btn"
                  onClick={() => handleSendMessage(s)}
                  disabled={isChatLoading || !chatSession}
                >
                  {s}
                </button>
              ))}
            </div>

            {/* Input Form */}
            <form 
              className="chat-input-wrapper"
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
            >
              <input
                type="text"
                className="chat-input"
                placeholder="Ask Cardiology AI about CAG findings, LVEF trends, drug reconciliation..."
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                disabled={isChatLoading || !chatSession}
              />
              <button
                type="submit"
                className="chat-send-btn"
                disabled={isChatLoading || !userInput.trim() || !chatSession}
                aria-label="Send message"
              >
                <Send size={16} />
              </button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
}

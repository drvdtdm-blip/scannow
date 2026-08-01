import React, { useState, useEffect, useRef } from 'react';
import { 
  FileText, BookOpen, MessageSquare, User, Activity, Stethoscope, 
  CheckSquare, AlertCircle, Copy, Check, FileDown, Send, ShieldAlert,
  ListTodo, Info, FileSearch, Calendar, Layers
} from 'lucide-react';

// Simple Markdown component to parse bold text and newlines
function SimpleMarkdown({ text }) {
  if (!text) return null;

  const lines = text.split('\n');

  return (
    <div className="markdown-content">
      {lines.map((line, idx) => {
        // Headers
        if (line.startsWith('### ')) {
          return <h4 key={idx} style={{ marginTop: '1rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>{parseLineContent(line.slice(4))}</h4>;
        }
        if (line.startsWith('## ')) {
          return <h3 key={idx} style={{ marginTop: '1.25rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>{parseLineContent(line.slice(3))}</h3>;
        }
        if (line.startsWith('# ')) {
          return <h2 key={idx} style={{ marginTop: '1.5rem', marginBottom: '0.75rem', color: 'var(--text-primary)' }}>{parseLineContent(line.slice(2))}</h2>;
        }

        // Bullet lists
        if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
          return (
            <ul key={idx} style={{ margin: '0.25rem 0 0.25rem 1.25rem' }}>
              <li>{parseLineContent(line.trim().slice(2))}</li>
            </ul>
          );
        }

        // Numbered lists
        const numMatch = line.trim().match(/^(\d+)\.\s(.*)/);
        if (numMatch) {
          return (
            <ol key={idx} start={numMatch[1]} style={{ margin: '0.25rem 0 0.25rem 1.25rem' }}>
              <li>{parseLineContent(numMatch[2])}</li>
            </ol>
          );
        }

        // Standard paragraph
        if (line.trim() === '') return <div key={idx} style={{ height: '0.5rem' }} />;
        return <p key={idx}>{parseLineContent(line)}</p>;
      })}
    </div>
  );
}

// Helper to parse line bold tags **bold**
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
  const [checkedActions, setCheckedActions] = useState({});
  
  const chatBottomRef = useRef(null);

  // Initialize chat messages when chatSession or reportData changes
  useEffect(() => {
    if (chatSession) {
      setChatMessages([
        { 
          role: 'assistant', 
          text: "I have successfully analyzed the medical document and created your EHR summary portal. How can I help you understand these results or recommendations today?" 
        }
      ]);
      setCheckedActions({});
    } else {
      setChatMessages([]);
    }
  }, [chatSession, reportData]);

  // Scroll to bottom of chat
  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isChatLoading, activeTab]);

  if (isAnalyzing) {
    return (
      <div className="insights-panel" style={{ padding: '2rem' }}>
        <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Activity className="logo-icon" size={20} />
          Compiling Medical Report Summary...
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
          <div className="skeleton-line medium"></div>
        </div>
      </div>
    );
  }

  if (status === 'failed') {
    return (
      <div className="insights-panel" style={{ padding: '2rem', justifyContent: 'center', alignItems: 'center', textAlign: 'center', display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ color: 'var(--color-danger)', marginBottom: '1rem' }}>
          <AlertCircle size={48} style={{ animation: 'pulse-slow 2s infinite' }} />
        </div>
        <h3 style={{ marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Analysis Failed</h3>
        <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '360px', margin: '0 auto 1.5rem auto', lineHeight: '1.5' }}>
          <p style={{ marginBottom: '0.75rem', fontWeight: 'bold' }}>Error Details:</p>
          <code style={{ display: 'block', padding: '0.75rem', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '4px', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', wordBreak: 'break-all', textAlign: 'left', color: '#fca5a5' }}>
            {errorMsg || "An unknown error occurred during document processing. Please check the console or ensure your API key has proper access."}
          </code>
        </div>
        <button 
          className="empty-state-action-btn" 
          onClick={() => window.location.reload()}
          style={{ background: 'rgba(244, 63, 94, 0.1)', border: '1px solid var(--color-danger)', color: '#fda4af' }}
        >
          Reload App & Retry
        </button>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="insights-panel" style={{ padding: '2rem', justifyContent: 'center', alignItems: 'center', color: 'var(--text-muted)' }}>
        <p>No document active. Upload a medical document to get started.</p>
      </div>
    );
  }

  const { 
    metadata, 
    executiveSummary, 
    diagnosis, 
    detailedAnalysis, 
    investigationsAndProcedures, 
    previousConsultations, 
    medications, 
    recommendations, 
    dictionary 
  } = reportData;

  const handleCopySummary = () => {
    const textToCopy = `
PATIENT MEDICAL DOCUMENT SUMMARY
--------------------------------------------------
Document Type: ${metadata.documentType || 'N/A'}
Patient Name: ${metadata.patientName || 'N/A'}
Date: ${metadata.documentDate || 'N/A'}
Facility: ${metadata.facilityName || 'N/A'}

Clinical Brief:
${executiveSummary || 'N/A'}

Clinical Diagnoses:
${diagnosis?.map(d => `- ${d}`).join('\n') || 'None'}

Medications (Active & Recommended):
${medications?.map(m => `- ${m}`).join('\n') || 'None'}

Investigations & Procedures Chronology:
${investigationsAndProcedures?.map(i => `- [${i.date}] ${i.name}: ${i.result}`).join('\n') || 'None'}

Previous Consultations Chronology:
${previousConsultations?.map(c => `- [${c.date}] ${c.specialtyOrProvider}: ${c.reasonOrOutcome}`).join('\n') || 'None'}

Care Plan Recommendations:
${recommendations?.map(r => `- [${r.category}] ${r.action}`).join('\n') || 'None'}

Disclaimer:
Always consult with a qualified physician or healthcare provider regarding any medical concern, diagnostic reading, or treatment decisions.
    `.trim();

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadTxt = () => {
    const textToCopy = `
PATIENT MEDICAL DOCUMENT SUMMARY
--------------------------------------------------
Document Type: ${metadata.documentType || 'N/A'}
Patient Name: ${metadata.patientName || 'N/A'}
Date: ${metadata.documentDate || 'N/A'}
Facility: ${metadata.facilityName || 'N/A'}

Clinical Brief:
${executiveSummary || 'N/A'}

Clinical Diagnoses:
${diagnosis?.map(d => `- ${d}`).join('\n') || 'None'}

Medications (Active & Recommended):
${medications?.map(m => `- ${m}`).join('\n') || 'None'}

Investigations & Procedures Chronology:
${investigationsAndProcedures?.map(i => `- [${i.date}] ${i.name}: ${i.result}`).join('\n') || 'None'}

Previous Consultations Chronology:
${previousConsultations?.map(c => `- [${c.date}] ${c.specialtyOrProvider}: ${c.reasonOrOutcome}`).join('\n') || 'None'}

Care Plan Recommendations:
${recommendations?.map(r => `- [${r.category}] ${r.action}`).join('\n') || 'None'}

Detailed Review:
${detailedAnalysis || 'N/A'}
    `.trim();

    const element = document.createElement("a");
    const file = new Blob([textToCopy], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `Medical_Summary_${(metadata.patientName || "Report").replace(/\s+/g, "_")}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleSendMessage = async (textToSend) => {
    const messageText = textToSend || userInput;
    if (!messageText.trim() || !chatSession || isChatLoading) return;

    setChatMessages(prev => [...prev, { role: 'user', text: messageText }]);
    if (!textToSend) setUserInput('');
    setIsChatLoading(true);

    try {
      const response = await chatSession.sendMessage(messageText);
      const replyText = response.response.text();
      setChatMessages(prev => [...prev, { role: 'assistant', text: replyText }]);
    } catch (err) {
      console.error("Chat error:", err);
      setChatMessages(prev => [...prev, { role: 'assistant', text: "Error communicating with AI. Please make sure your API key is correct and valid." }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const toggleActionItem = (index) => {
    setCheckedActions(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const suggestions = [
    "Are there any abnormal values in this timeline?",
    "Explain these recommendations simply",
    "What follow-up diagnostics should I do?",
    "Define terms in plain English"
  ];

  return (
    <div className="insights-panel">
      {/* Navigation tabs */}
      <div className="insights-header-tabs" role="tablist">
        <button 
          className={`tab-btn ${activeTab === 'summary' ? 'active' : ''}`}
          onClick={() => setActiveTab('summary')}
          role="tab"
          aria-selected={activeTab === 'summary'}
        >
          <FileText size={16} />
          EHR Summary
        </button>
        <button 
          className={`tab-btn ${activeTab === 'review' ? 'active' : ''}`}
          onClick={() => setActiveTab('review')}
          role="tab"
          aria-selected={activeTab === 'review'}
        >
          <FileSearch size={16} />
          Detailed Review
        </button>
        <button 
          className={`tab-btn ${activeTab === 'dictionary' ? 'active' : ''}`}
          onClick={() => setActiveTab('dictionary')}
          role="tab"
          aria-selected={activeTab === 'dictionary'}
        >
          <BookOpen size={16} />
          Patient Glossary ({dictionary?.length || 0})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'chat' ? 'active' : ''}`}
          onClick={() => setActiveTab('chat')}
          role="tab"
          aria-selected={activeTab === 'chat'}
        >
          <MessageSquare size={16} />
          Consult AI Chat
        </button>
      </div>

      {/* Insights Content Body */}
      <div className="insights-body">
        {activeTab === 'summary' && (
          <div className="summary-container">
            {/* Metadata Card */}
            <div className="summary-card">
              <div className="summary-card-header patient">
                <User size={16} />
                <span>Patient EHR Demographics</span>
              </div>
              <div className="patient-grid">
                <div className="patient-data-item">
                  <span className="patient-label">Patient Name</span>
                  <span className="patient-value">{metadata.patientName}</span>
                </div>
                <div className="patient-data-item">
                  <span className="patient-label">Age / Gender</span>
                  <span className="patient-value">{metadata.patientAge} / {metadata.patientGender}</span>
                </div>
                <div className="patient-data-item">
                  <span className="patient-label">Report Date</span>
                  <span className="patient-value">{metadata.documentDate}</span>
                </div>
                <div className="patient-data-item">
                  <span className="patient-label">Clinical Type</span>
                  <span className="patient-value" style={{ color: 'var(--color-primary)' }}>{metadata.documentType}</span>
                </div>
                <div className="patient-data-item" style={{ gridColumn: 'span 2' }}>
                  <span className="patient-label">Medical Facility</span>
                  <span className="patient-value">{metadata.facilityName}</span>
                </div>
              </div>
            </div>

            {/* Clinical Brief Card */}
            {executiveSummary && (
              <div className="summary-card" style={{ borderLeft: '4px solid var(--color-primary)', background: 'rgba(6, 182, 212, 0.02)' }}>
                <div className="summary-card-header" style={{ color: 'var(--color-primary)' }}>
                  <Info size={16} />
                  <span>Clinical Brief (Executive Summary)</span>
                </div>
                <p style={{ fontSize: '0.925rem', color: 'var(--text-primary)', lineHeight: '1.6' }}>{executiveSummary}</p>
              </div>
            )}

            {/* Pointwise Diagnosis Card */}
            {diagnosis && diagnosis.length > 0 && (
              <div className="summary-card" style={{ borderLeft: '4px solid var(--color-danger)', background: 'rgba(244, 63, 94, 0.02)' }}>
                <div className="summary-card-header findings" style={{ color: 'var(--color-danger)' }}>
                  <Stethoscope size={16} />
                  <span>Primary Diagnoses & Assessments</span>
                </div>
                <ul style={{ paddingLeft: '1.25rem', color: 'var(--text-secondary)', fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {diagnosis.map((item, i) => (
                    <li key={i} style={{ lineHeight: '1.5' }}>{parseLineContent(item)}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Medications Card (Only drug names, capsule pill tags) */}
            {medications && medications.length > 0 && (
              <div className="summary-card">
                <div className="summary-card-header actions" style={{ color: 'var(--color-success)', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
                  <Layers size={16} />
                  <span>Active & Recommended Medications</span>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem', marginBottom: '0.5rem' }}>
                  Listed by drug name only (consult physician for dosage and schedule):
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.25rem' }}>
                  {medications.map((med, i) => (
                    <span key={i} className="status-pill normal" style={{ fontSize: '0.85rem', padding: '0.35rem 0.75rem', borderRadius: '15px', fontWeight: '600' }}>
                      {med}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Investigations and Procedures Chronological Timeline */}
            {investigationsAndProcedures && investigationsAndProcedures.length > 0 && (
              <div className="summary-card">
                <div className="summary-card-header" style={{ color: 'var(--color-primary)' }}>
                  <Layers size={16} style={{ color: 'var(--color-primary)' }} />
                  <span>Investigations & Procedures Timeline</span>
                </div>
                <div className="timeline-container">
                  {investigationsAndProcedures.map((item, i) => (
                    <div key={i} className="timeline-item">
                      <div className="timeline-badge-date">{item.date}</div>
                      <div className="timeline-content-card">
                        <strong className="timeline-content-title">{item.name}</strong>
                        <p className="timeline-content-desc">{item.result}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Previous Consultations Chronological Timeline */}
            {previousConsultations && previousConsultations.length > 0 && (
              <div className="summary-card">
                <div className="summary-card-header" style={{ color: 'var(--color-accent)' }}>
                  <Calendar size={16} style={{ color: 'var(--color-accent)' }} />
                  <span>Clinical Consultations History</span>
                </div>
                <div className="timeline-container">
                  {previousConsultations.map((item, i) => (
                    <div key={i} className="timeline-item">
                      <div className="timeline-badge-date">{item.date}</div>
                      <div className="timeline-content-card">
                        <strong className="timeline-content-title">{item.specialtyOrProvider}</strong>
                        <p className="timeline-content-desc">{item.reasonOrOutcome}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations checklist */}
            {recommendations && recommendations.length > 0 && (
              <div className="summary-card">
                <div className="summary-card-header actions">
                  <ListTodo size={16} />
                  <span>Care Plan Checklist</span>
                </div>
                <div className="checklist-container">
                  {recommendations.map((rec, i) => (
                    <div 
                      key={i} 
                      className={`checklist-item ${checkedActions[i] ? 'checked' : ''}`}
                      onClick={() => toggleActionItem(i)}
                      role="checkbox"
                      aria-checked={checkedActions[i] || false}
                      tabIndex="0"
                      onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); toggleActionItem(i); } }}
                    >
                      <div className="check-box">
                        {checkedActions[i] && <Check size={12} />}
                      </div>
                      <div className="checklist-details">
                        <span className="checklist-category">{rec.category}</span>
                        <p className="checklist-action">{rec.action}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Export and Action Buttons */}
            <div className="summary-export-bar">
              <button className="export-btn" onClick={handleCopySummary} aria-label="Copy summary to clipboard">
                {copied ? <Check size={15} style={{ color: 'var(--color-success)' }} /> : <Copy size={15} />}
                <span>{copied ? 'Copied Brief' : 'Copy Summary'}</span>
              </button>
              <button className="export-btn primary" onClick={handleDownloadTxt} aria-label="Download summary as TXT">
                <FileDown size={15} />
                <span>Export EHR Summary</span>
              </button>
            </div>
          </div>
        )}

        {activeTab === 'review' && (
          <div className="summary-container" style={{ animation: 'fadeIn 0.4s ease-out' }}>
            {/* Detailed Summarized Paragraphs */}
            <div className="summary-card">
              <div className="summary-card-header" style={{ color: 'var(--color-primary)' }}>
                <FileText size={16} />
                <span>Clinical Document Breakdown</span>
              </div>
              <SimpleMarkdown text={detailedAnalysis} />
            </div>

            {/* Medical Disclaimer */}
            <div className="summary-card" style={{ background: 'rgba(244, 63, 94, 0.02)', borderColor: 'rgba(244, 63, 94, 0.15)' }}>
              <div className="summary-card-header disclaimer" style={{ color: 'var(--color-danger)' }}>
                <ShieldAlert size={16} />
                <span>Medical Intelligence Disclaimer</span>
              </div>
              <p className="disclaimer-text">
                AegisScan AI is an automated machine learning tool designed to facilitate document review and clinical concept education. This translation does NOT constitute official medical advice, diagnosis, treatment, or clinical opinion. Patients should review all medical documentation and clinical summaries directly with their primary care provider or specialist physician. Do not delay seeking medical consultation due to information provided here.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'dictionary' && (
          <div className="dictionary-grid">
            <h4 style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: '500' }}>
              The AI glossary definitions for complex terms in this medical document:
            </h4>
            
            {dictionary && dictionary.length > 0 ? (
              dictionary.map((item, i) => (
                <div key={i} className="dict-item-card">
                  <div className="dict-term-header">
                    <span className="dict-term-title">{item.term}</span>
                  </div>
                  <p className="dict-term-definition">{item.definition}</p>
                  {item.context && (
                    <p className="dict-term-context">
                      <strong>In your report:</strong> "{item.context}"
                    </p>
                  )}
                </div>
              ))
            ) : (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                No complex medical terminology extracted from this scan.
              </div>
            )}
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="chat-container">
            {/* Conversation Log */}
            <div className="chat-history">
              {chatMessages.map((msg, index) => (
                <div key={index} className={`chat-message ${msg.role === 'user' ? 'user' : 'assistant'}`}>
                  <span className="chat-sender">
                    {msg.role === 'user' ? 'Patient' : 'AegisScan AI Agent'}
                  </span>
                  <div className="chat-bubble">
                    <SimpleMarkdown text={msg.text} />
                  </div>
                </div>
              ))}
              
              {isChatLoading && (
                <div className="chat-message assistant">
                  <span className="chat-sender">AegisScan AI Agent</span>
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

            {/* Quick Suggestion Chips */}
            <div className="chat-suggestions">
              {suggestions.map((s, idx) => (
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
                placeholder="Ask a question about this clinical summary..."
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

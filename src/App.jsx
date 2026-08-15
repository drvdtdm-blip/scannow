import React, { useState, useEffect } from 'react';
import { Shield, Settings, Trash2, FileText, AlertTriangle, ShieldCheck, Activity } from 'lucide-react';
import UploadZone from './components/UploadZone';
import DocumentViewer from './components/DocumentViewer';
import InsightsPanel from './components/InsightsPanel';
import ApiKeyModal from './components/ApiKeyModal';
import { analyzeMedicalDocument, startDocumentChat } from './services/gemini';

export default function App() {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('gemini_api_key') || import.meta.env.VITE_GEMINI_API_KEY || '');
  const [isApiModalOpen, setIsApiModalOpen] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [activeDocId, setActiveDocId] = useState(null);

  // If no API key is found, open the API configuration modal automatically
  useEffect(() => {
    if (!apiKey) {
      setIsApiModalOpen(true);
    }
  }, [apiKey]);

  const handleKeySaved = (newKey) => {
    setApiKey(newKey);
  };

  const handleFileSelected = async (fileDetails) => {
    if (!apiKey) {
      setIsApiModalOpen(true);
      return;
    }

    const docId = `doc-${Date.now()}`;
    const newDoc = {
      id: docId,
      name: fileDetails.name,
      type: fileDetails.type,
      size: fileDetails.size,
      previewUrl: fileDetails.previewUrl,
      base64Data: fileDetails.base64Data,
      status: 'analyzing',
      reportData: null,
      chatSession: null,
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    // Add to state and set as active document
    setDocuments(prev => [newDoc, ...prev]);
    setActiveDocId(docId);

    try {
      // 1. Run document extraction & translation
      const reportData = await analyzeMedicalDocument(apiKey, fileDetails.base64Data, fileDetails.type);
      
      // 2. Initialize chat session with document context
      const chatSession = startDocumentChat(apiKey, fileDetails.base64Data, fileDetails.type);

      // Update state with analysis results
      setDocuments(prev => prev.map(doc => {
        if (doc.id === docId) {
          return {
            ...doc,
            status: 'completed',
            reportData,
            chatSession
          };
        }
        return doc;
      }));
    } catch (error) {
      console.error("Document Scanning Error:", error);
      setDocuments(prev => prev.map(doc => {
        if (doc.id === docId) {
          return {
            ...doc,
            status: 'failed',
            errorMsg: error.message || String(error),
            reportData: null,
            chatSession: null
          };
        }
        return doc;
      }));
    }
  };

  const handleDeleteDoc = (docId, e) => {
    e.stopPropagation();
    
    // Find the document to revoke its preview blob URL and avoid memory leaks
    const docToDelete = documents.find(d => d.id === docId);
    if (docToDelete && docToDelete.previewUrl) {
      URL.revokeObjectURL(docToDelete.previewUrl);
    }

    setDocuments(prev => prev.filter(doc => doc.id !== docId));
    
    if (activeDocId === docId) {
      setActiveDocId(null);
    }
  };

  const activeDoc = documents.find(doc => doc.id === activeDocId);

  return (
    <div className="app-container">
      {/* Top Header Navigation */}
      <header className="app-header">
        <div className="logo-section">
          <Activity className="logo-icon" size={26} style={{ color: 'var(--color-danger)' }} />
          <h1 className="logo-text">AegisScan Cardiology</h1>
          <span className="logo-badge" style={{ borderColor: 'rgba(244, 63, 94, 0.4)', color: 'var(--color-danger)', background: 'rgba(244, 63, 94, 0.1)' }}>Cardiologist Review AI</span>
        </div>

        <div className="header-actions">
          <button 
            className={`api-config-btn ${!apiKey ? 'key-missing' : ''}`}
            onClick={() => setIsApiModalOpen(true)}
            aria-label="Configure API Key"
          >
            <span className={`status-dot ${apiKey ? 'active' : 'inactive'}`}></span>
            <span>{apiKey ? 'API Connected' : 'Setup API Key'}</span>
            <Settings size={15} style={{ marginLeft: '0.25rem' }} />
          </button>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <div className="main-layout">
        
        {/* Sidebar Controls */}
        <aside className="sidebar" aria-label="Sidebar controls">
          
          {/* Section: Upload controls */}
          <div className="sidebar-section">
            <div className="section-title">
              <span>Report Intake Portal</span>
            </div>
            <UploadZone 
              onFileSelected={handleFileSelected} 
              disabled={!apiKey}
            />
          </div>

          {/* Section: Scan History list */}
          <div className="sidebar-section" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            <div className="section-title">
              <span>Summarized Patient Files</span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>({documents.length})</span>
            </div>
            
            <div className="doc-list" style={{ overflowY: 'auto', flex: 1 }} role="list">
              {documents.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                  No reports summarized yet.
                </div>
              ) : (
                documents.map((doc) => (
                  <div
                    key={doc.id}
                    className={`doc-item ${doc.id === activeDocId ? 'active' : ''}`}
                    onClick={() => setActiveDocId(doc.id)}
                    role="button"
                    tabIndex="0"
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setActiveDocId(doc.id); } }}
                    aria-label={`Select document ${doc.name}`}
                  >
                    <div className="doc-item-left">
                      <FileText className="doc-item-icon" size={18} />
                      <div className="doc-item-meta">
                        <div className="doc-item-name">{doc.name}</div>
                        <div className="doc-item-date">{doc.createdAt}</div>
                        <div className={`doc-item-status-badge ${doc.status}`}>
                          {doc.status === 'analyzing' && 'analyzing...'}
                          {doc.status === 'completed' && 'summarized'}
                          {doc.status === 'failed' && 'failed'}
                        </div>
                      </div>
                    </div>
                    
                    <button
                      className="doc-item-delete"
                      onClick={(e) => handleDeleteDoc(doc.id, e)}
                      title="Delete document"
                      aria-label={`Delete ${doc.name}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Secure Footer Info */}
          <div className="sidebar-section" style={{ borderTop: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.01)', padding: '1rem 1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.7rem' }}>
              <ShieldCheck size={14} style={{ color: 'var(--color-success)' }} />
              <span>Patient Data Stored Locally</span>
            </div>
          </div>
        </aside>

        {/* Dashboard Center Workspace */}
        <main className="dashboard-workspace" aria-label="Main content workspace">
          {activeDoc ? (
            <div className="scan-workspace">
              {/* Document Visualizer Panel */}
              <DocumentViewer 
                file={activeDoc} 
                isAnalyzing={activeDoc.status === 'analyzing'} 
              />
              
              {/* Report Insights and Q&A Console */}
              <InsightsPanel 
                reportData={activeDoc.reportData}
                chatSession={activeDoc.chatSession}
                isAnalyzing={activeDoc.status === 'analyzing'}
                status={activeDoc.status}
                errorMsg={activeDoc.errorMsg}
              />
            </div>
          ) : (
            // Landing Dashboard Welcome screen
            <div className="empty-state">
              <div className="empty-state-icon" style={{ borderColor: 'rgba(244, 63, 94, 0.2)', background: 'rgba(244, 63, 94, 0.05)' }}>
                <Shield size={38} className="logo-icon" style={{ color: 'var(--color-danger)' }} />
              </div>
              <h2 className="empty-state-title">Cardiology Clinical Record Summarizer AI</h2>
              <p className="empty-state-description">
                Upload scattered medical records (prescriptions, discharge summaries, ECGs, Echo, CAG/PCI reports, lab data). AegisScan converts records into a concise, evidence-based, 30-60 second chronological Cardiology Review containing clinical snapshot, quick view, LVEF trends, medication audit, and risk factor matrices.
              </p>
              
              {!apiKey ? (
                <button 
                  className="empty-state-action-btn"
                  onClick={() => setIsApiModalOpen(true)}
                >
                  Configure Gemini API Key
                </button>
              ) : (
                <div style={{ color: 'var(--color-primary)', fontSize: '0.85rem', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className="status-dot active"></span>
                  <span>System connected. Upload or drag a medical document into the intake portal on the left sidebar to begin.</span>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Configuration Settings Modal */}
      <ApiKeyModal 
        isOpen={isApiModalOpen}
        onClose={() => setIsApiModalOpen(false)}
        onKeySaved={handleKeySaved}
        currentKey={apiKey}
      />
    </div>
  );
}

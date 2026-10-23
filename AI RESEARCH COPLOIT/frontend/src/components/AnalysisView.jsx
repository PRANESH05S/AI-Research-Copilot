import React, { useState } from 'react';
import {
  FileSearch,
  CheckCircle,
  Copy,
  Download,
  AlertCircle,
  Sparkles,
  ExternalLink,
  BookOpen,
} from 'lucide-react';
import { api } from '../services/api';

export default function AnalysisView({ papers }) {
  const [selectedPaper, setSelectedPaper] = useState(papers[0]?.name || '');
  const [loading, setLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  const currentPaperMeta = papers.find((p) => p.name === selectedPaper);

  const handleAnalyze = async () => {
    if (!selectedPaper) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.analyzePaper(selectedPaper, true);
      setAnalysisResult(res);
    } catch (err) {
      setError(err.message || 'Failed to analyze paper');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!analysisResult?.analysis) return;
    navigator.clipboard.writeText(analysisResult.analysis);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!analysisResult?.analysis) return;
    const blob = new Blob([analysisResult.analysis], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analysis_${selectedPaper.replace('.pdf', '')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="view-container animate-fade-in">
      <div className="view-header-bar glass-panel">
        <div>
          <h2>Automated Paper Analysis</h2>
          <p className="view-subtitle">
            Deep-dive 14-dimensional academic extraction across methodology, models, datasets, metrics, and limitations.
          </p>
        </div>

        <div className="view-header-controls">
          <select
            id="analysis-paper-select"
            className="select-control"
            value={selectedPaper}
            onChange={(e) => setSelectedPaper(e.target.value)}
            disabled={loading}
          >
            {papers.map((p) => (
              <option key={p.name} value={p.name}>
                📄 {p.name} ({p.pages} pages)
              </option>
            ))}
          </select>

          <button
            id="btn-run-analysis"
            className="btn btn-primary"
            onClick={handleAnalyze}
            disabled={loading || !selectedPaper}
          >
            <FileSearch size={16} />
            <span>{loading ? 'Analyzing Paper...' : 'Run Deep Analysis'}</span>
          </button>
        </div>
      </div>

      {currentPaperMeta && (
        <div className="meta-banner glass-panel">
          <div className="meta-pill">
            <span className="meta-label">Selected Paper:</span>
            <span className="meta-val font-semibold">{currentPaperMeta.name}</span>
          </div>
          <div className="meta-pill">
            <span className="meta-label">Pages:</span>
            <span className="meta-val font-mono">{currentPaperMeta.pages}</span>
          </div>
          <div className="meta-pill">
            <span className="meta-label">Vector Chunks:</span>
            <span className="meta-val font-mono">{currentPaperMeta.chunks}</span>
          </div>
          <a
            href={api.getPaperFileUrl(currentPaperMeta.name)}
            target="_blank"
            rel="noreferrer"
            className="btn btn-secondary btn-sm"
          >
            <span>View PDF</span>
            <ExternalLink size={13} />
          </a>
        </div>
      )}

      {error && (
        <div className="error-banner glass-panel">
          <AlertCircle size={18} className="text-rose" />
          <span>{error}</span>
        </div>
      )}

      {loading && (
        <div className="loading-container glass-panel">
          <div className="loading-spinner">
            <Sparkles size={32} className="animate-spin text-indigo" />
          </div>
          <h3>Synthesizing Academic Dimensions</h3>
          <p className="text-secondary">
            Reading representative methodology, algorithmic architectures, and experimental findings from '{selectedPaper}'...
          </p>
        </div>
      )}

      {analysisResult && !loading && (
        <div className="analysis-result-card glass-panel animate-fade-in">
          <div className="result-card-header">
            <div className="result-title">
              <BookOpen size={20} className="text-indigo" />
              <span>Comprehensive Analysis Report: {analysisResult.paper}</span>
            </div>
            <div className="result-actions">
              <button
                id="btn-copy-analysis"
                className="btn btn-secondary btn-sm"
                onClick={handleCopy}
              >
                {copied ? <CheckCircle size={14} className="text-emerald" /> : <Copy size={14} />}
                <span>{copied ? 'Copied' : 'Copy Report'}</span>
              </button>
              <button
                id="btn-download-analysis"
                className="btn btn-secondary btn-sm"
                onClick={handleDownload}
              >
                <Download size={14} />
                <span>Download Report</span>
              </button>
            </div>
          </div>

          <div className="analysis-body markdown-content">
            {analysisResult.analysis.split('\n\n').map((block, idx) => {
              if (block.match(/^\d+\.\s/)) {
                const parts = block.split('\n');
                const title = parts[0];
                const rest = parts.slice(1).join('\n');
                return (
                  <div key={idx} className="analysis-dimension-section">
                    <h3>{title}</h3>
                    {rest && <p>{rest}</p>}
                  </div>
                );
              }
              return <p key={idx}>{block}</p>;
            })}
          </div>
        </div>
      )}

      {!analysisResult && !loading && (
        <div className="empty-placeholder-card glass-panel">
          <FileSearch size={48} className="text-muted" />
          <h3>Select a Research Paper & Run Analysis</h3>
          <p>
            Extracts research problems, system architecture, mathematical models, experimental results, and critical limitations in an academic format.
          </p>
        </div>
      )}
    </div>
  );
}

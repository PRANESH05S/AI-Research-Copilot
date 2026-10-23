import React, { useState } from 'react';
import {
  BookMarked,
  CheckCircle,
  Copy,
  Download,
  AlertCircle,
  Sparkles,
  FileText,
} from 'lucide-react';
import { api } from '../services/api';

export default function LiteratureReviewView({ papers }) {
  const [loading, setLoading] = useState(false);
  const [reviewResult, setReviewResult] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleGenerateReview = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.generateLiteratureReview(null, true);
      setReviewResult(res);
    } catch (err) {
      setError(err.message || 'Failed to generate literature review');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!reviewResult?.literature_review) return;
    navigator.clipboard.writeText(reviewResult.literature_review);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!reviewResult?.literature_review) return;
    const blob = new Blob([reviewResult.literature_review], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Chapter2_Literature_Review_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="view-container animate-fade-in">
      <div className="view-header-bar glass-panel">
        <div>
          <h2>Chapter 2: Literature Review Generator</h2>
          <p className="view-subtitle">
            Produces a structured academic thesis Chapter 2 (Sections 2.1 to 2.8) synthesizing your paper repository.
          </p>
        </div>

        <button
          id="btn-run-review"
          className="btn btn-primary"
          onClick={handleGenerateReview}
          disabled={loading}
        >
          <BookMarked size={16} />
          <span>{loading ? 'Synthesizing Review...' : 'Generate Chapter 2 Review'}</span>
        </button>
      </div>

      <div className="thesis-outline-banner glass-panel">
        <div className="outline-title">
          <FileText size={16} className="text-emerald" />
          <span>Academic Thesis Chapter 2 Structure (Sections 2.1 - 2.8)</span>
        </div>
        <div className="outline-tags">
          <span className="badge badge-emerald">2.1 Theoretical Background</span>
          <span className="badge badge-cyan">2.2 Evolution of Approaches</span>
          <span className="badge badge-primary">2.3 Classical ML Methods</span>
          <span className="badge badge-purple">2.4 Deep Learning & Edge AI</span>
          <span className="badge badge-primary">2.5 Comparative Matrix</span>
          <span className="badge badge-amber">2.6 Critical Limitations</span>
          <span className="badge badge-rose">2.7 Research Gaps</span>
          <span className="badge badge-cyan">2.8 Chapter Summary</span>
        </div>
      </div>

      {error && (
        <div className="error-banner glass-panel">
          <AlertCircle size={18} className="text-rose" />
          <span>{error}</span>
        </div>
      )}

      {loading && (
        <div className="loading-container glass-panel">
          <div className="loading-spinner">
            <Sparkles size={32} className="animate-spin text-emerald" />
          </div>
          <h3>Drafting Chapter 2: Literature Review</h3>
          <p className="text-secondary">
            Synthesizing theoretical foundations, model taxonomies, comparative metrics, and research gaps across your {papers.length} papers...
          </p>
        </div>
      )}

      {reviewResult && !loading && (
        <div className="analysis-result-card glass-panel animate-fade-in">
          <div className="result-card-header">
            <div className="result-title">
              <BookMarked size={20} className="text-emerald" />
              <span>Chapter 2: Literature Review Document</span>
            </div>
            <div className="result-actions">
              <button
                id="btn-copy-review"
                className="btn btn-secondary btn-sm"
                onClick={handleCopy}
              >
                {copied ? <CheckCircle size={14} className="text-emerald" /> : <Copy size={14} />}
                <span>{copied ? 'Copied' : 'Copy Chapter'}</span>
              </button>
              <button
                id="btn-download-review"
                className="btn btn-secondary btn-sm"
                onClick={handleDownload}
              >
                <Download size={14} />
                <span>Download Chapter (.txt)</span>
              </button>
            </div>
          </div>

          <div className="analysis-body markdown-content thesis-typography">
            {reviewResult.literature_review.split('\n\n').map((block, idx) => {
              if (block.match(/^2\.\d\s/)) {
                return <h2 key={idx} className="thesis-section-heading">{block}</h2>;
              }
              if (block.startsWith('2. LITERATURE REVIEW') || block.startsWith('CHAPTER 2')) {
                return <h1 key={idx} className="thesis-main-heading">{block}</h1>;
              }
              return <p key={idx}>{block}</p>;
            })}
          </div>
        </div>
      )}

      {!reviewResult && !loading && (
        <div className="empty-placeholder-card glass-panel">
          <BookMarked size={48} className="text-emerald" />
          <h3>Generate Thesis Chapter 2 in Minutes</h3>
          <p>
            Click "Generate Chapter 2 Review" to produce a coherent, synthesized literature review ready for your thesis or research report.
          </p>
        </div>
      )}
    </div>
  );
}

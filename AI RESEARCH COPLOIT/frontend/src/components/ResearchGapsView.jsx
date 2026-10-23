import React, { useState } from 'react';
import {
  Sparkles,
  CheckCircle,
  Copy,
  Download,
  AlertCircle,
  ShieldAlert,
  Lightbulb,
} from 'lucide-react';
import { api } from '../services/api';

export default function ResearchGapsView({ papers }) {
  const [loading, setLoading] = useState(false);
  const [gapsResult, setGapsResult] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleDetectGaps = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.detectResearchGaps(null, true);
      setGapsResult(res);
    } catch (err) {
      setError(err.message || 'Failed to detect research gaps');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!gapsResult?.research_gaps) return;
    navigator.clipboard.writeText(gapsResult.research_gaps);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!gapsResult?.research_gaps) return;
    const blob = new Blob([gapsResult.research_gaps], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `research_gaps_report_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="view-container animate-fade-in">
      <div className="view-header-bar glass-panel">
        <div>
          <h2>Research Gap & Innovation Detector</h2>
          <p className="view-subtitle">
            Uncovers unaddressed problems, hardware/edge bottlenecks, dataset limitations, and proposes novel research ideas.
          </p>
        </div>

        <button
          id="btn-run-gaps"
          className="btn btn-primary"
          onClick={handleDetectGaps}
          disabled={loading}
        >
          <Sparkles size={16} />
          <span>{loading ? 'Analyzing Corpus Gaps...' : 'Discover Research Gaps'}</span>
        </button>
      </div>

      <div className="corpus-scope-banner glass-panel">
        <div className="banner-icon-wrap">
          <Lightbulb size={24} className="text-amber" />
        </div>
        <div className="banner-content">
          <div className="banner-title">Corpus Grounding: {papers.length} Indexed Research Papers</div>
          <div className="banner-desc">
            FAISS semantic search queries limitations, unsolved challenges, and hardware constraints across all documents to uncover genuine research opportunities.
          </div>
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
            <Sparkles size={32} className="animate-spin text-amber" />
          </div>
          <h3>Uncovering Research Gaps & Novel Directions</h3>
          <p className="text-secondary">
            Scanning limitations, edge-processing constraints, and generalization bottlenecks across papers...
          </p>
        </div>
      )}

      {gapsResult && !loading && (
        <div className="analysis-result-card glass-panel animate-fade-in">
          <div className="result-card-header">
            <div className="result-title">
              <ShieldAlert size={20} className="text-amber" />
              <span>Identified Research Gaps & Novel Dissertation Directions</span>
            </div>
            <div className="result-actions">
              <button
                id="btn-copy-gaps"
                className="btn btn-secondary btn-sm"
                onClick={handleCopy}
              >
                {copied ? <CheckCircle size={14} className="text-emerald" /> : <Copy size={14} />}
                <span>{copied ? 'Copied' : 'Copy Gaps Report'}</span>
              </button>
              <button
                id="btn-download-gaps"
                className="btn btn-secondary btn-sm"
                onClick={handleDownload}
              >
                <Download size={14} />
                <span>Download Report</span>
              </button>
            </div>
          </div>

          {gapsResult.evidence_sources && gapsResult.evidence_sources.length > 0 && (
            <div className="sources-evidence-bar">
              <span className="text-secondary text-xs uppercase font-semibold">Evidence Grounding:</span>
              <div className="evidence-chips">
                {gapsResult.evidence_sources.map((e, idx) => (
                  <span key={idx} className="badge badge-amber font-mono">
                    📄 {e.paper} (p. {e.page})
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="analysis-body markdown-content">
            {gapsResult.research_gaps.split('\n\n').map((block, idx) => {
              if (block.startsWith('# ') || block.startsWith('## ') || block.startsWith('### ')) {
                return <h3 key={idx}>{block.replace(/#+\s*/, '')}</h3>;
              }
              return <p key={idx}>{block}</p>;
            })}
          </div>
        </div>
      )}

      {!gapsResult && !loading && (
        <div className="empty-placeholder-card glass-panel">
          <Sparkles size={48} className="text-amber" />
          <h3>Identify Open Challenges & High-Impact Project Ideas</h3>
          <p>
            Click "Discover Research Gaps" to synthesize persistent bottlenecks, hardware constraints, and novel research formulations from your library.
          </p>
        </div>
      )}
    </div>
  );
}

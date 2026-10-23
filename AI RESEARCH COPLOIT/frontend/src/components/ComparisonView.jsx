import React, { useState } from 'react';
import {
  Scale,
  CheckCircle,
  Copy,
  Download,
  AlertCircle,
  Sparkles,
  CheckSquare,
  Square,
} from 'lucide-react';
import { api } from '../services/api';

export default function ComparisonView({ papers }) {
  const [selectedPapers, setSelectedPapers] = useState(
    papers.slice(0, 2).map((p) => p.name)
  );
  const [loading, setLoading] = useState(false);
  const [comparisonResult, setComparisonResult] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  const togglePaper = (name) => {
    if (selectedPapers.includes(name)) {
      if (selectedPapers.length <= 2) {
        // keep at least 2
        return;
      }
      setSelectedPapers(selectedPapers.filter((p) => p !== name));
    } else {
      setSelectedPapers([...selectedPapers, name]);
    }
  };

  const handleCompare = async () => {
    if (selectedPapers.length < 2) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.comparePapers(selectedPapers, true);
      setComparisonResult(res);
    } catch (err) {
      setError(err.message || 'Comparison failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!comparisonResult?.comparison) return;
    navigator.clipboard.writeText(comparisonResult.comparison);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!comparisonResult?.comparison) return;
    const blob = new Blob([comparisonResult.comparison], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `paper_comparison_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="view-container animate-fade-in">
      <div className="view-header-bar glass-panel">
        <div>
          <h2>Multi-Paper Comparator</h2>
          <p className="view-subtitle">
            Cross-paper comparison across methodology, models, datasets, metrics, trade-offs, and unresolved challenges.
          </p>
        </div>

        <button
          id="btn-run-comparison"
          className="btn btn-primary"
          onClick={handleCompare}
          disabled={loading || selectedPapers.length < 2}
        >
          <Scale size={16} />
          <span>{loading ? 'Comparing...' : `Compare (${selectedPapers.length} Papers)`}</span>
        </button>
      </div>

      {/* Paper Selection Checklist */}
      <div className="selection-card glass-panel">
        <div className="selection-title">Select at least 2 papers to compare:</div>
        <div className="paper-checkbox-grid">
          {papers.map((p) => {
            const isSelected = selectedPapers.includes(p.name);
            return (
              <div
                key={p.name}
                className={`paper-checkbox-item glass-panel ${isSelected ? 'selected' : ''}`}
                onClick={() => togglePaper(p.name)}
              >
                {isSelected ? (
                  <CheckSquare size={18} className="text-indigo" />
                ) : (
                  <Square size={18} className="text-muted" />
                )}
                <div className="checkbox-label-wrap">
                  <div className="checkbox-paper-name">{p.name}</div>
                  <div className="checkbox-paper-sub font-mono">
                    {p.pages} pages • {p.chunks} chunks
                  </div>
                </div>
              </div>
            );
          })}
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
            <Sparkles size={32} className="animate-spin text-indigo" />
          </div>
          <h3>Synthesizing Multi-Paper Comparison</h3>
          <p className="text-secondary">
            Cross-referencing architectures, evaluation benchmarks, and trade-offs across {selectedPapers.length} papers...
          </p>
        </div>
      )}

      {comparisonResult && !loading && (
        <div className="analysis-result-card glass-panel animate-fade-in">
          <div className="result-card-header">
            <div className="result-title">
              <Scale size={20} className="text-indigo" />
              <span>Comparative Synthesis ({comparisonResult.papers.length} Papers)</span>
            </div>
            <div className="result-actions">
              <button
                id="btn-copy-comparison"
                className="btn btn-secondary btn-sm"
                onClick={handleCopy}
              >
                {copied ? <CheckCircle size={14} className="text-emerald" /> : <Copy size={14} />}
                <span>{copied ? 'Copied' : 'Copy Synthesis'}</span>
              </button>
              <button
                id="btn-download-comparison"
                className="btn btn-secondary btn-sm"
                onClick={handleDownload}
              >
                <Download size={14} />
                <span>Download Report</span>
              </button>
            </div>
          </div>

          <div className="analysis-body markdown-content">
            {comparisonResult.comparison.split('\n\n').map((block, idx) => {
              if (block.startsWith('# ') || block.startsWith('## ') || block.startsWith('### ')) {
                return <h3 key={idx}>{block.replace(/#+\s*/, '')}</h3>;
              }
              if (block.includes('|') && block.includes('-|-')) {
                // Render table
                const rows = block.trim().split('\n').map((r) =>
                  r.split('|').map((c) => c.trim()).filter(Boolean)
                );
                const headerRow = rows[0];
                const dataRows = rows.slice(2);
                return (
                  <div key={idx} className="table-wrapper">
                    <table className="comparison-table">
                      <thead>
                        <tr>
                          {headerRow.map((h, hIdx) => (
                            <th key={hIdx}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {dataRows.map((dr, rIdx) => (
                          <tr key={rIdx}>
                            {dr.map((c, cIdx) => (
                              <td key={cIdx}>{c}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              }
              return <p key={idx}>{block}</p>;
            })}
          </div>
        </div>
      )}
    </div>
  );
}

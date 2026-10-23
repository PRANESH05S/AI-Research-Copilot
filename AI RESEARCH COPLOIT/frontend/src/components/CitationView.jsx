import React, { useState } from 'react';
import {
  Quote,
  CheckCircle,
  Copy,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { api } from '../services/api';

export default function CitationView({ papers }) {
  const [selectedPaper, setSelectedPaper] = useState(papers[0]?.name || '');
  const [selectedStyle, setSelectedStyle] = useState('ALL');
  const [loading, setLoading] = useState(false);
  const [citationResult, setCitationResult] = useState(null);
  const [error, setError] = useState(null);
  const [copiedKey, setCopiedKey] = useState(null);

  const styles = ['ALL', 'IEEE', 'APA', 'MLA', 'CHICAGO'];

  const handleGenerate = async () => {
    if (!selectedPaper) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.generateCitation(selectedPaper, selectedStyle);
      setCitationResult(res);
    } catch (err) {
      setError(err.message || 'Citation generation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="view-container animate-fade-in">
      <div className="view-header-bar glass-panel">
        <div>
          <h2>Academic Citation Generator</h2>
          <p className="view-subtitle">
            Extracts bibliographic metadata from paper front matter and formats citations in IEEE, APA, MLA, or Chicago standard.
          </p>
        </div>

        <div className="view-header-controls">
          <select
            id="citation-paper-select"
            className="select-control"
            value={selectedPaper}
            onChange={(e) => setSelectedPaper(e.target.value)}
            disabled={loading}
          >
            {papers.map((p) => (
              <option key={p.name} value={p.name}>
                📄 {p.name}
              </option>
            ))}
          </select>

          <button
            id="btn-run-citation"
            className="btn btn-primary"
            onClick={handleGenerate}
            disabled={loading || !selectedPaper}
          >
            <Quote size={16} />
            <span>{loading ? 'Generating...' : 'Format Citation'}</span>
          </button>
        </div>
      </div>

      {/* Style selector pills */}
      <div className="style-pills-bar glass-panel">
        <span className="style-pills-label">Format Style:</span>
        <div className="style-pills-list">
          {styles.map((st) => (
            <button
              key={st}
              id={`citation-style-${st}`}
              className={`style-pill-btn ${selectedStyle === st ? 'active' : ''}`}
              onClick={() => setSelectedStyle(st)}
              disabled={loading}
            >
              {st}
            </button>
          ))}
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
          <h3>Parsing Front Matter & Formatting Citation</h3>
          <p className="text-secondary">
            Extracting title, authors, publication year, journal venue, and DOI from '{selectedPaper}'...
          </p>
        </div>
      )}

      {citationResult && !loading && (
        <div className="citation-results-container animate-fade-in">
          {citationResult.style === 'ALL' && citationResult.citations ? (
            <div className="citations-grid">
              {Object.entries(citationResult.citations).map(([st, citText]) => (
                <div key={st} className="citation-card glass-panel">
                  <div className="citation-card-header">
                    <span className="badge badge-primary">{st} Standard</span>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleCopy(citText, st)}
                    >
                      {copiedKey === st ? (
                        <CheckCircle size={14} className="text-emerald" />
                      ) : (
                        <Copy size={14} />
                      )}
                      <span>{copiedKey === st ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <div className="citation-text markdown-content">
                    <pre><code>{citText}</code></pre>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="citation-card glass-panel">
              <div className="citation-card-header">
                <span className="badge badge-primary">
                  {citationResult.style} Standard Citation
                </span>
                <button
                  id="btn-copy-single-citation"
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleCopy(citationResult.citation, 'single')}
                >
                  {copiedKey === 'single' ? (
                    <CheckCircle size={14} className="text-emerald" />
                  ) : (
                    <Copy size={14} />
                  )}
                  <span>{copiedKey === 'single' ? 'Copied' : 'Copy Citation'}</span>
                </button>
              </div>
              <div className="citation-text markdown-content">
                <pre><code>{citationResult.citation}</code></pre>
              </div>
            </div>
          )}
        </div>
      )}

      {!citationResult && !loading && (
        <div className="empty-placeholder-card glass-panel">
          <Quote size={48} className="text-muted" />
          <h3>Select a Research Paper and Format</h3>
          <p>
            Generate properly formatted bibliography references for IEEE conference papers, APA dissertations, MLA articles, or Chicago style.
          </p>
        </div>
      )}
    </div>
  );
}

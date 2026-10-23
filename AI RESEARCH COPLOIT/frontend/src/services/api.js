/**
 * AI Research Copilot - Frontend API Client
 * Connects to the FastAPI backend running on port 8000 (proxied via /api or direct fallback)
 */

const API_BASE = '/api';

export const api = {
  // System Health
  async getHealth() {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) throw new Error(`Health check failed (${res.status})`);
    return res.json();
  },

  // Papers Management
  async getPapers() {
    const res = await fetch(`${API_BASE}/papers`);
    if (!res.ok) throw new Error(`Failed to load papers (${res.status})`);
    return res.json();
  },

  async uploadPaper(file) {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Upload failed' }));
      throw new Error(err.detail || 'Upload failed');
    }
    return res.json();
  },

  async deletePaper(paperName, deleteFile = true) {
    const res = await fetch(`${API_BASE}/papers/${encodeURIComponent(paperName)}?delete_file=${deleteFile}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Deletion failed' }));
      throw new Error(err.detail || 'Deletion failed');
    }
    return res.json();
  },

  getPaperFileUrl(paperName) {
    return `${API_BASE}/paper-file/${encodeURIComponent(paperName)}`;
  },

  // Semantic Vector Search
  async search(query, topK = 5, paperFilter = null, scoreThreshold = 0.0) {
    const res = await fetch(`${API_BASE}/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        top_k: topK,
        paper_filter: paperFilter && paperFilter.length > 0 ? paperFilter : null,
        score_threshold: scoreThreshold,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Search failed' }));
      throw new Error(err.detail || 'Search failed');
    }
    return res.json();
  },

  // RAG Question Answering
  async ask(question, topK = 6, paperFilter = null, saveReport = false) {
    const res = await fetch(`${API_BASE}/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question,
        top_k: topK,
        paper_filter: paperFilter && paperFilter.length > 0 ? paperFilter : null,
        save_report: saveReport,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Ask request failed' }));
      throw new Error(err.detail || 'Ask request failed');
    }
    return res.json();
  },

  // Deep Paper Analysis
  async analyzePaper(paperName, saveReport = false) {
    const res = await fetch(`${API_BASE}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        paper_name: paperName,
        save_report: saveReport,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Analysis failed' }));
      throw new Error(err.detail || 'Analysis failed');
    }
    return res.json();
  },

  // Multi-Paper Comparison
  async comparePapers(paperNames, saveReport = false) {
    const res = await fetch(`${API_BASE}/compare`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        paper_names: paperNames,
        save_report: saveReport,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Comparison failed' }));
      throw new Error(err.detail || 'Comparison failed');
    }
    return res.json();
  },

  // Research Gap Detection
  async detectResearchGaps(paperNames = null, saveReport = false) {
    const res = await fetch(`${API_BASE}/research-gap`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        paper_names: paperNames && paperNames.length > 0 ? paperNames : null,
        save_report: saveReport,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Research gap analysis failed' }));
      throw new Error(err.detail || 'Research gap analysis failed');
    }
    return res.json();
  },

  // Literature Review Generation
  async generateLiteratureReview(paperNames = null, saveReport = false) {
    const res = await fetch(`${API_BASE}/literature-review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        paper_names: paperNames && paperNames.length > 0 ? paperNames : null,
        save_report: saveReport,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Literature review generation failed' }));
      throw new Error(err.detail || 'Literature review generation failed');
    }
    return res.json();
  },

  // Academic Citation Generator
  async generateCitation(paperName, style = 'IEEE') {
    const res = await fetch(`${API_BASE}/citation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        paper_name: paperName,
        style,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Citation generation failed' }));
      throw new Error(err.detail || 'Citation generation failed');
    }
    return res.json();
  },

  // Generated Outputs
  async getOutputs() {
    const res = await fetch(`${API_BASE}/outputs`);
    if (!res.ok) throw new Error(`Failed to load outputs (${res.status})`);
    return res.json();
  },
};

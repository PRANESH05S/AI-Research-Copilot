import React, { useState } from 'react';
import {
  Library,
  Upload,
  Trash2,
  ExternalLink,
  FileText,
  FileSearch,
  CheckCircle,
  AlertCircle,
  HardDrive,
  Layers,
  Sparkles,
} from 'lucide-react';
import { api } from '../services/api';

export default function PapersView({ papers, onSelectPaperForAnalysis, onRefresh, onOpenUpload }) {
  const [deletingName, setDeletingName] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
  const [deleteSuccess, setDeleteSuccess] = useState(null);

  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const handleDelete = async (paperName) => {
    if (!window.confirm(`Are you sure you want to delete '${paperName}' from the vector index and file storage?`)) {
      return;
    }

    setDeletingName(paperName);
    setDeleteError(null);
    setDeleteSuccess(null);

    try {
      await api.deletePaper(paperName, true);
      setDeleteSuccess(`'${paperName}' successfully removed from FAISS index and disk.`);
      onRefresh();
    } catch (err) {
      setDeleteError(err.message || 'Failed to delete paper');
    } finally {
      setDeletingName(null);
    }
  };

  const totalPages = papers.reduce((acc, p) => acc + (p.pages || 0), 0);
  const totalChunks = papers.reduce((acc, p) => acc + (p.chunks || 0), 0);
  const totalSize = papers.reduce((acc, p) => acc + (p.file_size || 0), 0);

  return (
    <div className="view-container animate-fade-in">
      <div className="view-header-bar glass-panel">
        <div>
          <h2>Research Paper Repository</h2>
          <p className="view-subtitle">
            Manage local PDFs, review chunk distribution, open original documents, and maintain synchronized FAISS indices.
          </p>
        </div>

        <button
          id="btn-upload-paper-repo"
          className="btn btn-primary"
          onClick={onOpenUpload}
        >
          <Upload size={16} />
          <span>Upload New Paper</span>
        </button>
      </div>

      {/* Summary Stats Row */}
      <div className="repo-stats-grid">
        <div className="repo-stat-card glass-panel">
          <div className="repo-stat-icon-wrap bg-indigo-subtle">
            <Library size={22} className="text-indigo" />
          </div>
          <div>
            <div className="repo-stat-val font-mono">{papers.length}</div>
            <div className="repo-stat-lbl">Indexed Documents</div>
          </div>
        </div>

        <div className="repo-stat-card glass-panel">
          <div className="repo-stat-icon-wrap bg-cyan-subtle">
            <FileText size={22} className="text-cyan" />
          </div>
          <div>
            <div className="repo-stat-val font-mono">{totalPages}</div>
            <div className="repo-stat-lbl">Total Pages Parsed</div>
          </div>
        </div>

        <div className="repo-stat-card glass-panel">
          <div className="repo-stat-icon-wrap bg-purple-subtle">
            <Layers size={22} className="text-purple" />
          </div>
          <div>
            <div className="repo-stat-val font-mono">{totalChunks}</div>
            <div className="repo-stat-lbl">FAISS Vector Chunks</div>
          </div>
        </div>

        <div className="repo-stat-card glass-panel">
          <div className="repo-stat-icon-wrap bg-emerald-subtle">
            <HardDrive size={22} className="text-emerald" />
          </div>
          <div>
            <div className="repo-stat-val font-mono">{formatBytes(totalSize)}</div>
            <div className="repo-stat-lbl">Storage Occupied</div>
          </div>
        </div>
      </div>

      {deleteSuccess && (
        <div className="success-banner glass-panel">
          <CheckCircle size={18} className="text-emerald" />
          <span>{deleteSuccess}</span>
        </div>
      )}

      {deleteError && (
        <div className="error-banner glass-panel">
          <AlertCircle size={18} className="text-rose" />
          <span>{deleteError}</span>
        </div>
      )}

      {/* Papers Table */}
      <div className="papers-table-container glass-panel">
        <table className="papers-table">
          <thead>
            <tr>
              <th>Paper Title & Filename</th>
              <th>Pages</th>
              <th>FAISS Chunks</th>
              <th>File Size</th>
              <th>Storage Status</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {papers.map((p) => (
              <tr key={p.name} className="paper-table-row">
                <td className="paper-name-col">
                  <div className="paper-icon-name">
                    <FileText size={18} className="text-indigo shrink-0" />
                    <div>
                      <div className="paper-name-text" title={p.name}>
                        {p.name}
                      </div>
                      <div className="paper-path-sub font-mono">
                        research_papers/{p.name}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="font-mono text-cyan font-semibold">{p.pages} pp</td>
                <td className="font-mono text-highlight">{p.chunks} chunks</td>
                <td className="font-mono text-muted">{formatBytes(p.file_size)}</td>
                <td>
                  <span className="badge badge-success">Indexed</span>
                </td>
                <td className="text-right">
                  <div className="paper-actions-group">
                    <a
                      href={api.getPaperFileUrl(p.name)}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-outline btn-sm"
                      title="Open PDF in new tab"
                    >
                      <ExternalLink size={13} />
                      <span>View PDF</span>
                    </a>

                    <button
                      className="btn btn-secondary btn-sm"
                      title="Run automated 14-dimension analysis"
                      onClick={() => onSelectPaperForAnalysis(p.name)}
                    >
                      <FileSearch size={13} />
                      <span>Analyze</span>
                    </button>

                    <button
                      className="btn btn-danger btn-sm"
                      title="Remove paper from FAISS index and delete file"
                      onClick={() => handleDelete(p.name)}
                      disabled={deletingName === p.name}
                    >
                      <Trash2 size={13} />
                      <span>{deletingName === p.name ? 'Deleting...' : 'Delete'}</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

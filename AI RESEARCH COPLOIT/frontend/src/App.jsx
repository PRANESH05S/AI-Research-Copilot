import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import ChatView from './components/ChatView';
import AnalysisView from './components/AnalysisView';
import ComparisonView from './components/ComparisonView';
import ResearchGapsView from './components/ResearchGapsView';
import LiteratureReviewView from './components/LiteratureReviewView';
import CitationView from './components/CitationView';
import PapersView from './components/PapersView';
import UploadModal from './components/UploadModal';
import { api } from './services/api';
import './App.css';

export default function App() {
  const [currentTab, setCurrentTab] = useState('chat');
  const [health, setHealth] = useState(null);
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedAnalysisPaper, setSelectedAnalysisPaper] = useState(null);

  const fetchSystemData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [healthData, papersData] = await Promise.all([
        api.getHealth().catch((e) => ({ status: 'error', error: e.message })),
        api.getPapers().catch(() => ({ count: 0, papers: [] })),
      ]);
      setHealth(healthData);
      setPapers(papersData.papers || []);
    } catch (err) {
      setError(err.message || 'Unable to connect to backend engine.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSystemData();
  }, []);

  const handleSelectPaperForAnalysis = (paperName) => {
    setSelectedAnalysisPaper(paperName);
    setCurrentTab('analysis');
  };

  return (
    <div className="app-root">
      <Header
        health={health}
        papersCount={papers.length}
        onOpenUpload={() => setUploadModalOpen(true)}
        onRefresh={fetchSystemData}
        loading={loading}
      />

      <div className="app-body">
        <Sidebar
          currentTab={currentTab}
          setTab={setCurrentTab}
          papersCount={papers.length}
        />

        <main className="main-viewport">
          {currentTab === 'chat' && (
            <ChatView papers={papers} />
          )}

          {currentTab === 'analysis' && (
            <AnalysisView
              papers={papers}
              initialPaper={selectedAnalysisPaper}
            />
          )}

          {currentTab === 'compare' && (
            <ComparisonView papers={papers} />
          )}

          {currentTab === 'gaps' && (
            <ResearchGapsView papers={papers} />
          )}

          {currentTab === 'review' && (
            <LiteratureReviewView papers={papers} />
          )}

          {currentTab === 'citation' && (
            <CitationView papers={papers} />
          )}

          {currentTab === 'papers' && (
            <PapersView
              papers={papers}
              onSelectPaperForAnalysis={handleSelectPaperForAnalysis}
              onRefresh={fetchSystemData}
              onOpenUpload={() => setUploadModalOpen(true)}
            />
          )}
        </main>
      </div>

      <UploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onUploadSuccess={() => {
          fetchSystemData();
        }}
      />
    </div>
  );
}

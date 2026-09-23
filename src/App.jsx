import { useCallback, useEffect, useState } from 'react';
import Footer from './components/Footer.jsx';
import Header from './components/Header.jsx';
import Home from './components/Home.jsx';
import ToolView from './components/ToolView.jsx';
import { useFiles } from './hooks/useFiles.js';
import { getTool } from './lib/tools.js';

function toolIdFromHash() {
  const raw = window.location.hash.replace(/^#\/?/, '').trim();
  return getTool(raw) ? raw : '';
}

export default function App() {
  const filesApi = useFiles();
  const { clearAll } = filesApi;

  const [toolId, setToolId] = useState(toolIdFromHash);

  // Keep state in sync with the URL hash so back/forward and shared links work.
  useEffect(() => {
    const onHash = () => setToolId(toolIdFromHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  // Every tool (and Home) starts from a clean slate — leftover files from a
  // previous tool would only confuse things, and clearing them is the more
  // private default.
  useEffect(() => {
    clearAll();
    window.scrollTo(0, 0);
  }, [toolId, clearAll]);

  const openTool = useCallback((id) => {
    window.location.hash = id;
  }, []);

  const goHome = useCallback(() => {
    window.location.hash = '';
  }, []);

  const tool = getTool(toolId);

  return (
    <div className="min-h-full flex flex-col">
      <Header onHome={goHome} />
      {tool ? (
        <ToolView key={tool.id} tool={tool} filesApi={filesApi} onBack={goHome} />
      ) : (
        <Home onOpen={openTool} />
      )}
      <Footer />
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import './App.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function App() {
  const [status, setStatus] = useState(null);
  const [series, setSeries] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([
      fetch(`${API_BASE}/api/status`).then((r) => r.json()),
      fetch(`${API_BASE}/api/series`).then((r) => r.json()),
    ])
      .then(([statusData, seriesData]) => {
        setStatus(statusData);
        setSeries(seriesData);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-badge">Microsoft Reactor</div>
        <h1>🤖 Microsoft AI Genius</h1>
        <p>Advance your AI skills and power up your productivity with cutting-edge AI tech and tools.</p>
        <a
          className="series-link"
          href="https://developer.microsoft.com/en-us/reactor/series/s-1453/"
          target="_blank"
          rel="noreferrer"
        >
          View Series ↗
        </a>
      </header>

      <main className="app-main">
        {loading && <p className="loading">Loading...</p>}
        {error && <p className="error">Could not reach backend: {error}</p>}

        {series && (
          <section className="series-card">
            <h2>📚 {series.name}</h2>
            <p className="series-desc">{series.description}</p>
            <div className="episodes-grid">
              {series.topics.map((topic) => (
                <div key={topic.episode} className="episode-card">
                  <span className="episode-number">Ep {topic.episode}</span>
                  <p className="episode-title">{topic.title}</p>
                  <span className={`episode-status ${topic.status}`}>{topic.status}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {status && (
          <section className="status-card">
            <h2>⚙️ Backend Status</h2>
            <ul>
              <li><strong>Status:</strong> <span className="tag green">{status.status}</span></li>
              <li><strong>Environment:</strong> {status.environment}</li>
              <li><strong>SpecKit enabled:</strong> {String(status.speckit?.enabled)}</li>
              <li><strong>Timestamp:</strong> {status.timestamp}</li>
            </ul>
          </section>
        )}
      </main>

      <footer className="app-footer">
        <p>
          Built with{' '}
          <a href="https://react.dev" target="_blank" rel="noreferrer">React</a>
          {' '}+{' '}
          <a href="https://dotnet.microsoft.com" target="_blank" rel="noreferrer">.NET</a>
          {' '}· Episode 2 — SpecKit
        </p>
      </footer>
    </div>
  );
}

export default App;

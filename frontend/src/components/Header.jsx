import React from 'react';
import { Layers, Server, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';

export default function Header({ isServerOnline, isCheckingServer, onCheckServer, taskCount }) {
  return (
    <header className="app-header">
      <div className="header-container">
        <div className="header-brand">
          <div className="brand-logo-glow">
            <Layers className="brand-icon" size={26} />
          </div>
          <div>
            <div className="brand-title-wrap">
              <h1 className="brand-title">TaskFlow MERN</h1>
              <span className="badge-practical">Practical 6</span>
            </div>
            <p className="brand-subtitle">
              Full-Stack React + Node.js/Express + MongoDB Integration
            </p>
          </div>
        </div>

        <div className="header-actions">
          <div className={`server-status-pill ${isServerOnline ? 'online' : 'offline'}`}>
            <span className="pulse-dot"></span>
            <Server size={14} />
            <span>{isServerOnline ? 'Backend Connected' : 'Server Disconnected'}</span>
            <button
              className={`btn-icon-refresh ${isCheckingServer ? 'spinning' : ''}`}
              onClick={onCheckServer}
              title="Ping Backend Server"
              aria-label="Refresh server status"
            >
              <RefreshCw size={12} />
            </button>
          </div>

          <div className="author-tag">
            <span>24IT037</span>
          </div>
        </div>
      </div>
    </header>
  );
}

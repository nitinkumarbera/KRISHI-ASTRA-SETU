import { StrictMode, Component } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// ── Error Boundary: shows errors instead of blank page ──────
class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(e) { return { error: e }; }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: '40px', fontFamily: 'monospace', background: '#FEF2F2', minHeight: '100vh' }}>
          <h1 style={{ color: '#DC2626', fontSize: '20px' }}>🚨 Runtime Error Detected</h1>
          <p style={{ color: '#111', marginTop: '16px', fontSize: '15px', fontWeight: 700 }}>{this.state.error.message}</p>
          <pre style={{ marginTop: '12px', background: '#fff', padding: '16px', borderRadius: '8px', overflow: 'auto', fontSize: '12px', color: '#374151' }}>
            {this.state.error.stack}
          </pre>
          <p style={{ marginTop: '16px', color: '#6B7280' }}>Fix the error above and refresh the page.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)

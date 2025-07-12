import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to console or external service
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '2rem',
          textAlign: 'center',
          background: '#1a1a1a',
          color: '#fff',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <h2 style={{ color: '#0ff', marginBottom: '1rem' }}>
            🚨 Something went wrong
          </h2>
          <p style={{ marginBottom: '1rem', color: '#ccc' }}>
            The application encountered an unexpected error.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '0.75rem 1.5rem',
              background: '#0ff',
              color: '#000',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: '500'
            }}
          >
            Reload Page
          </button>
          
          {process.env.NODE_ENV === 'development' && (
            <details style={{ marginTop: '2rem', maxWidth: '600px' }}>
              <summary style={{ cursor: 'pointer', color: '#888' }}>
                Error Details (Development)
              </summary>
              <pre style={{ 
                background: '#333', 
                padding: '1rem', 
                borderRadius: '4px', 
                overflow: 'auto',
                textAlign: 'left',
                fontSize: '0.8rem',
                marginTop: '1rem'
              }}>
                {this.state.error && this.state.error.toString()}
                <br />
                {this.state.errorInfo.componentStack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

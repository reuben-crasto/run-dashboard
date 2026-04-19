export default function ConnectPrompt({ authError = false }) {
  return (
    <div className="app">
      <div className="connect-wrap">
        <h1>Run Dashboard</h1>
        {authError ? (
          <p className="auth-error">
            OAuth completed but the connection failed — tokens may not have saved.
            Please try connecting again.
          </p>
        ) : (
          <p>Connect your Strava account to get started.</p>
        )}
        <button
          className="connect-btn"
          onClick={() => { window.location.href = '/api/auth/strava'; }}
        >
          Connect to Strava
        </button>
      </div>
    </div>
  );
}

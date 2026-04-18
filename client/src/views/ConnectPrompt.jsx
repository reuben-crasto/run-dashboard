export default function ConnectPrompt() {
  return (
    <div className="app">
      <div className="connect-wrap">
        <h1>Run Dashboard</h1>
        <p>Connect your Strava account to get started.</p>
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

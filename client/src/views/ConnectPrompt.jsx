export default function ConnectPrompt() {
  return (
    <div className="app">
      <div className="connect-wrap">
        <h1>Run Dashboard</h1>
        <p>Connect your Strava account to get started.</p>
        <a
          className="connect-btn"
          href="/api/auth/strava"
          onClick={(e) => {
            e.preventDefault();
            window.location.href = '/api/auth/strava';
          }}
        >
          Connect to Strava
        </a>
      </div>
    </div>
  );
}

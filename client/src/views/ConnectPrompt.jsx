import { useEffect } from 'react';

export default function ConnectPrompt() {
  useEffect(() => {
    const id = setTimeout(() => {
      window.location.assign('/auth/strava');
    }, 250);
    return () => clearTimeout(id);
  }, []);

  return (
    <div className="app">
      <div className="connect-wrap">
        <h1>Run Dashboard</h1>
        <p>Connecting to Strava...</p>
        <a className="connect-btn" href="/auth/strava">Connect to Strava</a>
      </div>
    </div>
  );
}

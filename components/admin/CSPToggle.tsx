'use client';

import { useState, useEffect } from 'react';

interface CSPStatus {
  cspEnabled: boolean;
  message: string;
  timestamp: string;
}

export default function CSPToggle() {
  const [cspStatus, setCspStatus] = useState<CSPStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch current CSP status
  const fetchCSPStatus = async () => {
    try {
      const response = await fetch('/api/admin/csp');
      if (!response.ok) {
        throw new Error('Failed to fetch CSP status');
      }
      const data = await response.json();
      setCspStatus(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  // Toggle CSP
  const toggleCSP = async (enabled: boolean) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/csp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ enabled }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to toggle CSP');
      }

      const data = await response.json();
      setCspStatus(data);

      // Show success message
      alert(data.message + '\n\nNote: ' + data.note);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCSPStatus();
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium">Content Security Policy</h3>
          <p className="text-sm text-gray-600">{cspStatus ? cspStatus.message : 'Loading...'}</p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => toggleCSP(false)}
            disabled={loading || cspStatus?.cspEnabled === false}
            className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Disable
          </button>
          <button
            onClick={() => toggleCSP(true)}
            disabled={loading || cspStatus?.cspEnabled === true}
            className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Enable
          </button>
        </div>
      </div>

      {loading && <div className="text-sm text-blue-600">Updating CSP...</div>}

      {error && <div className="text-sm text-red-600">Error: {error}</div>}

      <div className="text-xs text-gray-500">
        <button onClick={fetchCSPStatus} className="text-blue-500 hover:text-blue-700 underline">
          Refresh Status
        </button>
      </div>
    </div>
  );
}

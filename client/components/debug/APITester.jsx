import { useState } from 'react';
import axios from 'axios';
export default function APITester() {
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(false);

  const testEndpoint = async (name, endpoint, method = 'GET', data = null) => {
    setResults(prev => ({ ...prev, [name]: { status: 'loading' } }));
    try {
      const config = {
        method,
        url: `${import.meta.env.VITE_API_URL}${endpoint}`,
        withCredentials: true,
      };
      if (data) config.data = data;
      const response = await axios(config);
      setResults(prev => ({
        ...prev,
        [name]: {
          status: 'success',
          data: response.data,
          statusCode: response.status,
        },
      }));
    } catch (error) {
      setResults(prev => ({
        ...prev,
        [name]: {
          status: 'error',
          error: error.response?.data || error.message,
          statusCode: error.response?.status,
        },
      }));
    }
  };

  const runAllTests = async () => {
    setLoading(true);
    setResults({});
    await testEndpoint('auth', '/auth/me');
    await testEndpoint('currentPlan', '/api/plans/current');
    await testEndpoint('planHistory', '/api/plans/history');
    await testEndpoint('generationStatus', '/api/plans/generation/status');
    await testEndpoint('notifications', '/api/notifications');
    await testEndpoint('notificationStats', '/api/notifications/stats');
    await testEndpoint('generatePlan', '/api/plans/generate', 'POST', {});
    setLoading(false);
  };

  const clearResults = () => {
    setResults({});
  };

  return (
    <div
      style={{
        padding: '20px',
        background: '#2C332E',
        color: '#E0E0E0',
        borderRadius: '10px',
        margin: '20px',
        fontFamily: 'monospace',
      }}
    >
      <h3>API Endpoint Tester</h3>
      <p>
       this is for endpoint testing
      </p>

      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={runAllTests}
          disabled={loading}
          style={{
            background: '#ADC97E',
            color: '#2C332E',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '5px',
            marginRight: '10px',
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Testing...' : 'Run All Tests'}
        </button>

        <button
          onClick={clearResults}
          style={{
            background: '#FF6B6B',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '5px',
            cursor: 'pointer',
          }}
        >
          Clear Results
        </button>
      </div>

      <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
        {Object.entries(results).map(([testName, result]) => (
          <div
            key={testName}
            style={{
              margin: '10px 0',
              padding: '10px',
              background:
                result.status === 'success'
                  ? '#1e3a1e'
                  : result.status === 'error'
                    ? '#3a1e1e'
                    : '#3a3a1e',
              borderRadius: '5px',
              border: '1px solid #555',
            }}
          >
            <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
              {testName} -
              <span
                style={{
                  color:
                    result.status === 'success'
                      ? '#90EE90'
                      : result.status === 'error'
                        ? '#FFB6C1'
                        : '#FFFFE0',
                }}
              >
                {result.status.toUpperCase()}
              </span>
              {result.statusCode && (
                <span style={{ marginLeft: '10px', color: '#888' }}>
                  ({result.statusCode})
                </span>
              )}
            </div>

            {result.status === 'success' && (
              <div style={{ fontSize: '12px', color: '#ccc' }}>
                <strong>Response:</strong>
                <pre
                  style={{
                    background: '#1a1a1a',
                    padding: '5px',
                    borderRadius: '3px',
                    overflow: 'auto',
                  }}
                >
                  {JSON.stringify(result.data, null, 2)}
                </pre>
              </div>
            )}

            {result.status === 'error' && (
              <div style={{ fontSize: '12px', color: '#ffcccc' }}>
                <strong>Error:</strong>
                <pre
                  style={{
                    background: '#1a1a1a',
                    padding: '5px',
                    borderRadius: '3px',
                    overflow: 'auto',
                  }}
                >
                  {JSON.stringify(result.error, null, 2)}
                </pre>
              </div>
            )}
          </div>
        ))}
      </div>

      {Object.keys(results).length === 0 && !loading && (
        <div
          style={{
            textAlign: 'center',
            padding: '40px',
            color: '#888',
            fontStyle: 'italic',
          }}
        >
          Start
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { Settings, X, CheckCircle, XCircle, Loader } from 'lucide-react';
import { saveSettings, loadSettings } from '../utils/settings';
import authService from '../services/authService';
import { getMockServers, getDefaultMockServerUrl, type MockServer } from '../services/postmanApi';

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
}

type ConnectionStatus = 'idle' | 'testing' | 'success' | 'error';

export function SettingsModal({ open, onClose }: SettingsModalProps) {
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [mockServers, setMockServers] = useState<MockServer[]>([]);
  const [selectedMockUrl, setSelectedMockUrl] = useState('');
  const [loadingMocks, setLoadingMocks] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('idle');
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    if (open) {
      const settings = loadSettings();
      setClientId(settings.clientId || '');
      setSelectedMockUrl(settings.mockServerUrl || '');

      // Never pre-fill secret (security best practice)
      setClientSecret('');
      setConnectionStatus('idle');
      setStatusMessage('');

      // Fetch mock servers dynamically
      loadMockServers();
    }
  }, [open]);

  const loadMockServers = async () => {
    setLoadingMocks(true);
    try {
      // Fetch mock servers using centralized config
      const servers = await getMockServers();

      if (servers.length > 0) {
        setMockServers(servers);
        // If no mock server is selected yet, select the first one
        if (!selectedMockUrl) {
          setSelectedMockUrl(servers[0].url);
        }
      } else {
        // No servers found or no API key, use default
        const defaultUrl = getDefaultMockServerUrl();
        setMockServers([{
          name: 'Default Mock Server (No API Key)',
          url: defaultUrl,
          id: 'default',
          collection: 'C2M API',
          workspace: 'default'
        }]);
        setSelectedMockUrl(defaultUrl);
      }
    } catch (error) {
      console.error('Failed to load mock servers:', error);
      // Fall back to default on error
      const defaultUrl = getDefaultMockServerUrl();
      setMockServers([{
        name: 'Default Mock Server (Error)',
        url: defaultUrl,
        id: 'default',
        collection: 'C2M API',
        workspace: 'default'
      }]);
      setSelectedMockUrl(defaultUrl);
    } finally {
      setLoadingMocks(false);
    }
  };

  const handleTestConnection = async () => {
    if (!clientId || !clientSecret) {
      setConnectionStatus('error');
      setStatusMessage('Please enter both Client ID and Secret');
      return;
    }

    setConnectionStatus('testing');
    setStatusMessage('Testing connection...');

    try {
      const result = await authService.testConnection(clientId, clientSecret);

      if (result.success) {
        setConnectionStatus('success');
        setStatusMessage(`✓ Successfully authenticated (Token: ${result.tokenId})`);
      } else {
        setConnectionStatus('error');
        setStatusMessage(`✗ ${result.message}`);
      }
    } catch (error) {
      setConnectionStatus('error');
      setStatusMessage(`✗ ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleSave = () => {
    saveSettings({
      clientId,
      clientSecret,
      mockServerUrl: selectedMockUrl
    });
    onClose();
  };

  if (!open) return null;

  const selectedMock = mockServers.find(m => m.url === selectedMockUrl);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
      <div className="bg-[#1E1E1E] rounded-xl max-w-2xl w-full border border-[#3A3A3A]">
        {/* Header */}
        <div className="border-b border-[#3A3A3A] p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Settings className="w-6 h-6 text-[#00ADB5]" />
            <h2 className="text-2xl font-bold text-white">Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#2A2A2A] rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Mock Server Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Mock Server
            </label>
            <p className="text-xs text-gray-400 mb-2">
              Configured via <code className="bg-[#1E1E1E] px-1 py-0.5 rounded">/config/postman-config.json</code>
            </p>
            {loadingMocks ? (
              <div className="flex items-center gap-2 text-gray-400 p-3">
                <Loader className="w-4 h-4 animate-spin" />
                <span>Loading mock servers from configured workspaces...</span>
              </div>
            ) : (
              <>
                <select
                  value={selectedMockUrl}
                  onChange={(e) => setSelectedMockUrl(e.target.value)}
                  className="w-full bg-[#121212] border border-[#3A3A3A] rounded-lg p-3 text-gray-200 focus:border-[#00ADB5] focus:outline-none"
                >
                  {mockServers.map((server) => (
                    <option key={server.id} value={server.url}>
                      {server.name}
                    </option>
                  ))}
                </select>
                {selectedMockUrl && (
                  <div className="mt-2 text-xs text-gray-400 font-mono break-all bg-[#121212] border border-[#3A3A3A] rounded-lg p-2">
                    {selectedMockUrl}
                  </div>
                )}
                {mockServers.length === 1 && mockServers[0].id === 'default' && (
                  <div className="mt-2 bg-yellow-900/20 border border-yellow-700 text-yellow-200 p-3 rounded-lg text-sm">
                    Using default mock server. Configure API keys in .env.local and enable workspaces in postman-config.json to load dynamic mock servers.
                  </div>
                )}
              </>
            )}
          </div>

          {/* Client ID */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Client ID
            </label>
            <input
              type="text"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              placeholder="your-client-id"
              className="w-full bg-[#121212] border border-[#3A3A3A] rounded-lg p-3 text-gray-200 placeholder-gray-500 focus:border-[#00ADB5] focus:outline-none"
            />
          </div>

          {/* Client Secret */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Client Secret
            </label>
            <input
              type="password"
              value={clientSecret}
              onChange={(e) => setClientSecret(e.target.value)}
              placeholder="Enter client secret"
              className="w-full bg-[#121212] border border-[#3A3A3A] rounded-lg p-3 text-gray-200 placeholder-gray-500 focus:border-[#00ADB5] focus:outline-none"
              data-1p-ignore
              data-lpignore="true"
            />
            <p className="text-xs text-gray-500 mt-1">Secret is never stored for security</p>
          </div>

          {/* Test Connection */}
          <div className="pt-4 border-t border-[#3A3A3A]">
            <button
              onClick={handleTestConnection}
              disabled={connectionStatus === 'testing'}
              className="w-full px-4 py-2 bg-[#2A2A2A] hover:bg-[#3A3A3A] rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {connectionStatus === 'testing' && <Loader className="w-4 h-4 animate-spin" />}
              {connectionStatus === 'success' && <CheckCircle className="w-4 h-4 text-green-400" />}
              {connectionStatus === 'error' && <XCircle className="w-4 h-4 text-red-400" />}
              <span>
                {connectionStatus === 'testing' ? 'Testing...' : 'Test Connection'}
              </span>
            </button>

            {/* Status Message */}
            {statusMessage && (
              <div className={`mt-3 p-3 rounded-lg text-sm ${
                connectionStatus === 'success' ? 'bg-green-900/20 border border-green-700 text-green-200' :
                connectionStatus === 'error' ? 'bg-red-900/20 border border-red-700 text-red-200' :
                connectionStatus === 'testing' ? 'bg-blue-900/20 border border-blue-700 text-blue-200' :
                'bg-gray-900/20 border border-gray-700 text-gray-200'
              }`}>
                {statusMessage}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-[#3A3A3A] p-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-[#2A2A2A] hover:bg-[#3A3A3A] rounded-lg font-semibold transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-[#00ADB5] hover:bg-[#00BFC9] rounded-lg font-semibold transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

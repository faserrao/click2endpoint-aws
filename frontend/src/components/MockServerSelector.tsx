import React, { useState, useEffect } from 'react';
import { RefreshCw, Server, AlertCircle } from 'lucide-react';
import { getPostmanMockServers, getDefaultMockServerUrl, type WorkspaceType, type MockServer } from '../services/postmanApi';

interface MockServerSelectorProps {
  onServerSelect: (url: string) => void;
  initialWorkspace?: WorkspaceType;
}

export const MockServerSelector: React.FC<MockServerSelectorProps> = ({ 
  onServerSelect, 
  initialWorkspace = 'personal' 
}) => {
  const [workspace, setWorkspace] = useState<WorkspaceType>(initialWorkspace);
  const [mockServers, setMockServers] = useState<MockServer[]>([]);
  const [selectedServer, setSelectedServer] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch mock servers when workspace changes
  useEffect(() => {
    fetchMockServers();
  }, [workspace]);

  const fetchMockServers = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const servers = await getPostmanMockServers(workspace);
      
      if (servers && servers.length > 0) {
        setMockServers(servers);
        // Select first server by default
        const firstServer = servers[0];
        setSelectedServer(firstServer.url);
        onServerSelect(firstServer.url);
      } else {
        // No servers found or no API key, use default
        const defaultUrl = getDefaultMockServerUrl();
        setMockServers([{
          name: 'Default Mock Server',
          url: defaultUrl,
          id: 'default',
          collection: 'C2M API',
          workspace: 'default'
        }]);
        setSelectedServer(defaultUrl);
        onServerSelect(defaultUrl);
        setError('No Postman API key found. Using default mock server.');
      }
    } catch (err) {
      const defaultUrl = getDefaultMockServerUrl();
      setMockServers([{
        name: 'Default Mock Server',
        url: defaultUrl,
        id: 'default',
        collection: 'C2M API',
        workspace: 'default'
      }]);
      setSelectedServer(defaultUrl);
      onServerSelect(defaultUrl);
      setError('Failed to fetch mock servers. Using default.');
    } finally {
      setLoading(false);
    }
  };

  const handleServerChange = (url: string) => {
    setSelectedServer(url);
    onServerSelect(url);
  };

  return (
    <div className="bg-[#2A2A2A] p-4 rounded-lg border border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Server className="w-5 h-5" />
          Mock Server Configuration
        </h3>
        <button
          onClick={fetchMockServers}
          disabled={loading}
          className="p-2 hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
          title="Refresh mock servers"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Workspace selector */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Workspace Type
        </label>
        <div className="flex gap-2">
          <button
            onClick={() => setWorkspace('personal')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              workspace === 'personal' 
                ? 'bg-[#00ADB5] text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Personal
          </button>
          <button
            onClick={() => setWorkspace('team')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              workspace === 'team' 
                ? 'bg-[#00ADB5] text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Team
          </button>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-4 p-3 bg-yellow-900/20 border border-yellow-700 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-yellow-500" />
          <span className="text-sm text-yellow-200">{error}</span>
        </div>
      )}

      {/* Mock server selector */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Select Mock Server
        </label>
        {loading ? (
          <div className="text-gray-400 text-sm">Loading mock servers...</div>
        ) : (
          <select
            value={selectedServer}
            onChange={(e) => handleServerChange(e.target.value)}
            className="w-full px-3 py-2 bg-[#1E1E1E] border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#00ADB5]"
          >
            {mockServers.map((server) => (
              <option key={server.id} value={server.url}>
                {server.name}
              </option>
            ))}
          </select>
        )}
        
        {/* Display selected server URL */}
        {selectedServer && (
          <div className="mt-2 p-2 bg-[#1E1E1E] rounded border border-gray-700">
            <p className="text-xs text-gray-400 font-mono truncate" title={selectedServer}>
              {selectedServer}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
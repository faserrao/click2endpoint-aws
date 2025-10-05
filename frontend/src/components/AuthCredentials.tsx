import React, { useState } from 'react';
import { Key, AlertCircle } from 'lucide-react';

interface AuthCredentialsProps {
  onCredentialsChange: (clientId: string, clientSecret: string) => void;
  defaultClientId?: string;
  defaultClientSecret?: string;
}

export const AuthCredentials: React.FC<AuthCredentialsProps> = ({
  onCredentialsChange,
  defaultClientId = 'test-client-123',
  defaultClientSecret = 'test-secret-456'
}) => {
  const [clientId, setClientId] = useState(defaultClientId);
  const [clientSecret, setClientSecret] = useState(defaultClientSecret);
  const [showSecret, setShowSecret] = useState(false);

  const handleClientIdChange = (value: string) => {
    setClientId(value);
    onCredentialsChange(value, clientSecret);
  };

  const handleClientSecretChange = (value: string) => {
    setClientSecret(value);
    onCredentialsChange(clientId, value);
  };

  return (
    <div className="bg-[#2A2A2A] p-4 rounded-lg border border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Key className="w-5 h-5" />
          Authentication Credentials
        </h3>
      </div>

      <div className="mb-3 p-3 bg-blue-900/20 border border-blue-700 rounded-lg flex items-start gap-2">
        <AlertCircle className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
        <div className="text-sm text-blue-200">
          <p className="font-medium mb-1">Test Credentials</p>
          <p className="text-xs">The default values are test credentials for the mock server. Replace with your actual credentials for production use.</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Client ID */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Client ID
          </label>
          <input
            type="text"
            value={clientId}
            onChange={(e) => handleClientIdChange(e.target.value)}
            placeholder="Enter your client ID"
            className="w-full px-3 py-2 bg-[#1E1E1E] border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#00ADB5] focus:border-transparent"
          />
        </div>

        {/* Client Secret */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Client Secret
          </label>
          <div className="relative">
            <input
              type={showSecret ? 'text' : 'password'}
              value={clientSecret}
              onChange={(e) => handleClientSecretChange(e.target.value)}
              placeholder="Enter your client secret"
              className="w-full px-3 py-2 pr-10 bg-[#1E1E1E] border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#00ADB5] focus:border-transparent"
            />
            <button
              type="button"
              onClick={() => setShowSecret(!showSecret)}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
              title={showSecret ? 'Hide secret' : 'Show secret'}
            >
              {showSecret ? '👁️' : '👁️‍🗨️'}
            </button>
          </div>
        </div>
      </div>

      <div className="mt-4 text-xs text-gray-400">
        <p>These credentials will be used in the generated code for authentication with the C2M API.</p>
      </div>
    </div>
  );
};
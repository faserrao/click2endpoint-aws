import React from 'react';
import { Terminal, X, CheckCircle, XCircle, Clock } from 'lucide-react';
import type { ExecutionResult } from './CodeGenerator';

interface ExecutionOutputProps {
  results: ExecutionResult[];
  onClose: () => void;
  isPanel?: boolean;
}

export const ExecutionOutput: React.FC<ExecutionOutputProps> = ({ 
  results, 
  onClose, 
  isPanel = false 
}) => {
  const content = (
    <div className={`bg-[#1E1E1E] rounded-xl ${isPanel ? 'h-full flex flex-col' : 'w-full max-w-5xl max-h-[90vh] flex flex-col'}`}>
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Terminal className="w-6 h-6 text-[#00ADB5]" />
            <h2 className="text-2xl font-bold text-white">Execution Output</h2>
          </div>
          {isPanel && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              title="Close panel"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {results.length === 0 ? (
          <div className="text-center py-12">
            <Terminal className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No execution results yet.</p>
            <p className="text-sm text-gray-500 mt-2">Click the Run button on the code to see output here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {results.map((result, index) => (
              <div 
                key={index} 
                className={`border rounded-lg ${
                  result.success ? 'border-green-800' : 'border-red-800'
                }`}
              >
                <div className="bg-[#2A2A2A] p-4 border-b border-gray-700 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {result.success ? (
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-400" />
                    )}
                    <span className={`font-medium ${
                      result.success ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {result.success ? 'Success' : 'Failed'}
                    </span>
                    <span className="text-gray-400 text-sm">
                      {result.language && `• ${result.language.toUpperCase()}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-500 text-sm">
                    <Clock className="w-4 h-4" />
                    {result.timestamp && new Date(result.timestamp).toLocaleTimeString()}
                  </div>
                </div>
                
                <pre className="bg-black p-4 overflow-x-auto">
                  {result.output && (
                    <code className="text-sm text-gray-300 block">{result.output}</code>
                  )}
                  {result.error && (
                    <code className="text-sm text-red-400 block">{result.error}</code>
                  )}
                </pre>
              </div>
            ))}
          </div>
        )}
      </div>

      {!isPanel && (
        <div className="p-6 border-t border-gray-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );

  if (isPanel) {
    return content;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-6 z-50">
      {content}
    </div>
  );
};
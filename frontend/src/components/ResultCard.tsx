import React, { useState } from 'react';
import { getEndpoint } from '../data/questions';
import { CodeGenerator, type ExecutionResult } from './CodeGenerator';
import { ExecutionOutput } from './ExecutionOutput';
import { ParameterCollector } from './ParameterCollector';

interface ResultCardProps {
  answers: Record<string, string>;
  endpointMap: any;
  onRestart: () => void;
  mockServerUrl?: string;
  clientId?: string;
  clientSecret?: string;
}

export const ResultCard: React.FC<ResultCardProps> = ({ 
  answers, 
  endpointMap, 
  onRestart, 
  mockServerUrl,
  clientId,
  clientSecret 
}) => {
  const [showCodeGenerator, setShowCodeGenerator] = useState(false);
  const [showExecutionOutput, setShowExecutionOutput] = useState(false);
  const [showParameters, setShowParameters] = useState(false);
  const [executionResults, setExecutionResults] = useState<ExecutionResult[]>([]);
  const [parameters, setParameters] = useState<any>({});
  
  const endpointPath = getEndpoint(answers);
  const endpoint = endpointPath ? endpointMap[endpointPath] : null;

  const handleExecutionResult = (result: ExecutionResult | null) => {
    if (result) {
      setExecutionResults(prev => [result, ...prev].slice(0, 10)); // Keep last 10 results
      if (!showExecutionOutput) {
        setShowExecutionOutput(true);
      }
    }
  };

  const getPanelWidth = () => {
    const panelsShown = 1 + (showCodeGenerator ? 1 : 0) + (showExecutionOutput ? 1 : 0);
    switch (panelsShown) {
      case 1: return 'w-full';
      case 2: return 'w-1/2';
      case 3: return 'w-1/3';
      default: return 'w-full';
    }
  };

  if (!endpoint) {
    return (
      <div className="bg-[#1E1E1E] p-8 rounded-xl">
        <h2 className="text-2xl font-bold mb-4 text-red-500">Error</h2>
        <p className="text-gray-300 mb-6">Could not determine the appropriate endpoint based on your answers.</p>
        <button 
          onClick={onRestart} 
          className="px-6 py-3 bg-[#00ADB5] hover:bg-[#00BFC9] rounded-lg transition-colors"
        >
          🔄 Restart Wizard
        </button>
      </div>
    );
  }

  return (
    <div className="flex gap-6 h-[80vh]">
      {/* Main Result Card - Left Panel */}
      <div className={`bg-[#1E1E1E] p-8 rounded-xl overflow-y-auto transition-all duration-300 ${getPanelWidth()}`}>
        <h2 className="text-3xl font-bold mb-2 text-[#00ADB5]">Perfect Match Found!</h2>
        <p className="text-gray-400 mb-6">Based on your requirements, here's your recommended endpoint:</p>
        
        <div className="bg-[#2A2A2A] p-6 rounded-lg mb-6">
          <h3 className="text-xl font-semibold text-white mb-2">{endpoint.path}</h3>
          <p className="text-gray-300">{endpoint.description}</p>
        </div>

        <div className="mb-6">
          <h4 className="text-lg font-semibold text-gray-200 mb-3">Your Selections:</h4>
          <div className="space-y-2">
            {Object.entries(answers).map(([key, value]) => (
              <div key={key} className="flex justify-between bg-[#2A2A2A] p-3 rounded">
                <span className="text-gray-400 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                <span className="text-white font-medium">{value === 'true' ? 'Yes' : value === 'false' ? 'No' : value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <h4 className="text-lg font-semibold text-gray-200 mb-3">Example cURL Request:</h4>
          <pre className="bg-black p-4 rounded text-sm overflow-x-auto">
            <code className="text-green-400">{endpoint.jwtExample}</code>
          </pre>
        </div>

        <div className="mb-6">
          <h4 className="text-lg font-semibold text-gray-200 mb-3">Example Payload:</h4>
          <pre className="bg-black p-4 rounded text-sm overflow-x-auto">
            <code className="text-blue-400">{JSON.stringify(endpoint.payloadExample, null, 2)}</code>
          </pre>
        </div>

        {/* Parameters Section */}
        {!showParameters && (
          <div className="mb-6 bg-[#2A2A2A] p-6 rounded-lg">
            <h4 className="text-lg font-semibold text-gray-200 mb-3">Need to customize parameters?</h4>
            <p className="text-gray-400 mb-4">Fill in actual values for the API parameters to generate ready-to-use code.</p>
            <button 
              className="px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
              onClick={() => setShowParameters(true)}
            >
              Customize Parameters →
            </button>
          </div>
        )}

        {showParameters && (
          <div className="mb-6">
            <ParameterCollector
              endpointPath={endpoint.path}
              onParametersChange={setParameters}
              wizardAnswers={answers}
            />
          </div>
        )}

        <div className="flex gap-4 flex-wrap">
          <button
            onClick={onRestart}
            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
          >
            🔄 Start Over
          </button>
          <button
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            onClick={() => {
              // Map endpoint paths to operation IDs
              const operationIdMap: Record<string, string> = {
                '/jobs/single-doc-job-template': 'submitSingleDocWithTemplateParams',
                '/jobs/multi-docs-job-template': 'submitMultiDocWithTemplateParams',
                '/jobs/multi-doc-merge-job-template': 'mergeMultiDocWithTemplateParams',
                '/jobs/single-doc': 'singleDocJobParams',
                '/jobs/multi-doc': 'submitMultiDocParams',
                '/jobs/multi-doc-merge': 'mergeMultiDocParams',
                '/jobs/single-pdf-split': 'splitPdfParams',
                '/jobs/single-pdf-split-addressCapture': 'splitPdfWithCaptureParams',
              };

              const operationId = operationIdMap[endpoint.path] || endpoint.path.replace(/^\//, '').replace(/\//g, '-');
              window.open(`https://faserrao.github.io/c2m-api-repo/#operation/${operationId}`, '_blank');
            }}
          >
            📖 View Documentation
          </button>
          <button
            className={`px-6 py-3 rounded-lg transition-colors ${
              showCodeGenerator
                ? 'bg-gray-700 hover:bg-gray-600'
                : 'bg-[#00ADB5] hover:bg-[#00BFC9]'
            }`}
            onClick={() => setShowCodeGenerator(!showCodeGenerator)}
          >
            {showCodeGenerator ? '← Hide Code' : 'Generate SDK Code →'}
          </button>
          {executionResults.length > 0 && !showExecutionOutput && (
            <button 
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
              onClick={() => setShowExecutionOutput(true)}
            >
              Show Output →
            </button>
          )}
        </div>
      </div>
      
      {/* Code Generator - Middle Panel */}
      {showCodeGenerator && (
        <div className={`animate-slide-in-right transition-all duration-300 ${getPanelWidth()}`}>
          <CodeGenerator
            endpoint={endpoint}
            onClose={() => setShowCodeGenerator(false)}
            isPanel={true}
            onExecutionResult={handleExecutionResult}
            customParameters={parameters}
            mockServerUrl={mockServerUrl}
            clientId={clientId}
            clientSecret={clientSecret}
          />
        </div>
      )}

      {/* Execution Output - Right Panel */}
      {showExecutionOutput && (
        <div className={`animate-slide-in-right transition-all duration-300 ${getPanelWidth()}`}>
          <ExecutionOutput
            results={executionResults}
            onClose={() => setShowExecutionOutput(false)}
            isPanel={true}
          />
        </div>
      )}
    </div>
  );
};
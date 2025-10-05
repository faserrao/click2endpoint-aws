import React, { useState, useEffect } from 'react';
import { ProgressBar } from './components/ProgressBar';
import { QuestionCard } from './components/QuestionCard';
import { ResultCard } from './components/ResultCard';
import { SettingsModal } from './components/SettingsModal';
import { LoginPage } from './components/LoginPage';
import { loadSettings } from './utils/settings';
import { getDefaultMockServerUrl } from './services/postmanApi';
import { cognitoAuth } from './services/cognitoAuth';
import endpointMap from './data/endpointMap';
import { Settings, LogOut } from 'lucide-react';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [currentUser, setCurrentUser] = useState<string>('');
  const [currentView, setCurrentView] = useState<'welcome' | 'questions' | 'result'>('welcome');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [mockServerUrl, setMockServerUrl] = useState<string>(getDefaultMockServerUrl());
  const [clientId, setClientId] = useState<string>('');
  const [clientSecret, setClientSecret] = useState<string>('');
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);

  // Check authentication on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const user = await cognitoAuth.getCurrentUser();
      if (user) {
        setIsAuthenticated(true);
        setCurrentUser(user.username);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLoginSuccess = () => {
    checkAuth();
  };

  const handleLogout = () => {
    cognitoAuth.logout();
    setIsAuthenticated(false);
    setCurrentUser('');
    setCurrentView('welcome');
    setAnswers({});
  };

  // Load settings from localStorage on mount
  useEffect(() => {
    const settings = loadSettings();
    if (settings.clientId) setClientId(settings.clientId);
    if (settings.clientSecret) setClientSecret(settings.clientSecret);
    if (settings.mockServerUrl) setMockServerUrl(settings.mockServerUrl);
  }, []);

  const getTotalSteps = () => {
    // Determine total steps based on document type
    const docType = answers.docType;
    if (docType === 'pdfSplit') {
      return 2; // docType + recipientStyle
    } else if (docType === 'single') {
      return 3; // docType + templateUsage + recipientStyle
    } else if (docType === 'multi' || docType === 'merge') {
      return 4; // docType + templateUsage + recipientStyle + personalized
    }
    return 3; // default
  };

  const getCurrentStep = () => {
    return Object.keys(answers).length;
  };

  const handleStartWizard = () => {
    setCurrentView('questions');
    setAnswers({});
  };

  const handleRestart = () => {
    setCurrentView('welcome');
    setAnswers({});
  };

  const handleComplete = () => {
    setCurrentView('result');
  };

  const handleBack = () => {
    if (Object.keys(answers).length === 0) {
      setCurrentView('welcome');
    }
  };

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  // Main app (authenticated users only)
  return (
    <div className="min-h-screen bg-[#121212] text-gray-200 flex items-center justify-center p-6">
      {/* Settings gear icon and logout button - top right corner */}
      <div className="fixed top-6 right-6 flex items-center gap-3 z-40">
        {/* User info and logout */}
        <div className="flex items-center gap-3 bg-[#1E1E1E] px-4 py-2 rounded-lg border border-[#3A3A3A]">
          <span className="text-sm text-gray-400">{currentUser}</span>
          <button
            onClick={handleLogout}
            className="p-2 hover:bg-[#2A2A2A] rounded-lg transition-all"
            title="Logout"
          >
            <LogOut className="w-4 h-4 text-gray-400 hover:text-red-400 transition-colors" />
          </button>
        </div>

        {/* Settings */}
        <button
          onClick={() => setSettingsOpen(true)}
          className="p-3 bg-[#1E1E1E] hover:bg-[#2A2A2A] rounded-lg border border-[#3A3A3A] hover:border-[#00ADB5] transition-all"
          title="Settings"
        >
          <Settings className="w-6 h-6 text-gray-400 hover:text-[#00ADB5] transition-colors" />
        </button>
      </div>

      {/* Settings Modal */}
      <SettingsModal
        open={settingsOpen}
        onClose={() => {
          setSettingsOpen(false);
          // Reload settings after closing modal
          const settings = loadSettings();
          if (settings.clientId) setClientId(settings.clientId);
          if (settings.clientSecret) setClientSecret(settings.clientSecret);
          if (settings.mockServerUrl) setMockServerUrl(settings.mockServerUrl);
        }}
      />

      <div className={`w-full ${currentView === 'result' ? 'max-w-7xl' : 'max-w-4xl'}`}>
        {currentView === 'questions' && (
          <div className="mb-6">
            <ProgressBar step={getCurrentStep()} totalSteps={getTotalSteps()} />
          </div>
        )}

        {currentView === 'welcome' && (
          <div className="space-y-8">
            <div className="bg-[#1E1E1E] p-12 rounded-xl text-center">
              <h1 className="text-4xl font-bold text-[#00ADB5] mb-4">Click2Endpoint</h1>
              <p className="text-gray-400 mb-8 text-lg">
                Find the perfect C2M API endpoint for your document submission needs
              </p>
              <button
                className="px-8 py-4 bg-[#00ADB5] hover:bg-[#00BFC9] rounded-lg text-lg font-semibold transition-colors"
                onClick={handleStartWizard}
              >
                🚀 Start Wizard
              </button>
            </div>

            {/* Settings Reminder Card */}
            {(!clientId || !clientSecret) && (
              <div className="bg-gradient-to-r from-yellow-900/40 to-orange-900/40 p-6 rounded-xl border-2 border-yellow-500/60 shadow-lg shadow-yellow-500/20">
                <div className="flex items-start gap-4">
                  <div className="text-4xl">⚠️</div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-yellow-400 mb-2">
                      ⚡ Configure API Credentials Required
                    </h3>
                    <p className="text-gray-200 text-sm mb-4 font-medium">
                      Click the gear icon (⚙️) in the top-right corner to set your Client ID and Client Secret.
                    </p>
                    <button
                      onClick={() => setSettingsOpen(true)}
                      className="px-5 py-2.5 bg-yellow-500 hover:bg-yellow-400 text-black rounded-lg text-sm font-bold transition-colors inline-flex items-center gap-2 shadow-md"
                    >
                      <Settings className="w-4 h-4" />
                      Open Settings Now
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        
        {currentView === 'questions' && (
          <QuestionCard 
            answers={answers} 
            setAnswers={setAnswers} 
            onComplete={handleComplete}
            onBack={handleBack}
          />
        )}
        
        {currentView === 'result' && (
          <ResultCard 
            answers={answers} 
            endpointMap={endpointMap} 
            onRestart={handleRestart}
            mockServerUrl={mockServerUrl}
            clientId={clientId}
            clientSecret={clientSecret}
          />
        )}
      </div>
    </div>
  );
}

export default App;
// Settings utilities for localStorage persistence

export interface Settings {
  clientId: string;
  clientSecret: string;
  mockServerUrl: string;
}

const SETTINGS_KEY = 'click2endpoint_settings';

export function saveSettings(settings: Settings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Failed to save settings:', error);
  }
}

export function loadSettings(): Settings {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load settings:', error);
  }

  return {
    clientId: '',
    clientSecret: '',
    mockServerUrl: ''
  };
}

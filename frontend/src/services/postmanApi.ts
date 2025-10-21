// Postman Config Types
interface PostmanConfig {
  version: string;
  description: string;
  workspaces: {
    id: string;
    name: string;
    apiKeyEnvVar: string;
    enabled: boolean;
    note?: string;
  }[];
  mockServerFilters: {
    namePatterns: string[];
    collectionPatterns: string[];
    excludePatterns: string[];
  };
  displaySettings: {
    showWorkspaceName: boolean;
    showCollectionName: boolean;
    sortBy: string;
    nameFormat: string;
  };
}

// Postman API Response Types
interface PostmanCollection {
  uid: string;
  name: string;
  id: string;
}

interface PostmanMock {
  id: string;
  name: string;
  mockUrl?: string;
  collection?: string;
  config?: {
    mockUrl?: string;
  };
}

// Our Mock Server Type
export interface MockServer {
  name: string;
  url: string;
  id: string;
  collection: string;
  workspace: string;
}

const POSTMAN_API_BASE = 'https://api.getpostman.com';

// Cache for config and collections
let configCache: PostmanConfig | null = null;
let collectionsCache: Map<string, Map<string, PostmanCollection>> = new Map();

/**
 * Load centralized Postman configuration
 */
async function loadConfig(): Promise<PostmanConfig> {
  if (configCache) {
    return configCache;
  }

  try {
    const response = await fetch('/postman-config.json');
    if (!response.ok) {
      throw new Error(`Failed to load config: ${response.statusText}`);
    }
    configCache = await response.json();
    return configCache!;
  } catch (error) {
    console.error('Error loading Postman config:', error);
    // Return default config if file not found
    return {
      version: '1.0',
      description: 'Default config',
      workspaces: [],
      mockServerFilters: {
        namePatterns: ['C2M API v2', 'c2mapiv2'],
        collectionPatterns: ['c2mapiv2'],
        excludePatterns: ['deprecated', 'test', 'old']
      },
      displaySettings: {
        showWorkspaceName: true,
        showCollectionName: true,
        sortBy: 'name',
        nameFormat: '{mockName} ({collectionName})'
      }
    };
  }
}

/**
 * Get API key from environment variable
 */
function getApiKey(envVarName: string): string | null {
  // @ts-ignore - env vars are available at runtime
  return import.meta.env[envVarName] || null;
}

/**
 * Fetch all collections from a workspace
 */
async function getCollectionsForWorkspace(
  workspaceId: string,
  apiKey: string
): Promise<Map<string, PostmanCollection>> {
  // Check cache first
  if (collectionsCache.has(workspaceId)) {
    return collectionsCache.get(workspaceId)!;
  }

  try {
    const response = await fetch(`${POSTMAN_API_BASE}/collections`, {
      headers: {
        'X-Api-Key': apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch collections: ${response.statusText}`);
    }

    const data = await response.json();
    const collections = data.collections || [];

    // Create map of collection UID -> collection
    const collectionMap = new Map(
      collections.map((col: PostmanCollection) => [col.uid, col])
    );

    // Cache it
    collectionsCache.set(workspaceId, collectionMap);
    return collectionMap;
  } catch (error) {
    console.error(`Error fetching collections for workspace ${workspaceId}:`, error);
    return new Map();
  }
}

/**
 * Fetch all mocks from a workspace
 */
async function getMocksFromWorkspace(
  workspaceId: string,
  apiKey: string
): Promise<PostmanMock[]> {
  try {
    const response = await fetch(`${POSTMAN_API_BASE}/mocks?workspace=${workspaceId}`, {
      headers: {
        'X-Api-Key': apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch mocks: ${response.statusText}`);
    }

    const data = await response.json();
    return data.mocks || [];
  } catch (error) {
    console.error(`Error fetching mocks from workspace ${workspaceId}:`, error);
    return [];
  }
}

/**
 * Check if a string matches any of the patterns (case-insensitive)
 */
function matchesPatterns(text: string, patterns: string[]): boolean {
  const lowerText = text.toLowerCase();
  return patterns.some(pattern => lowerText.includes(pattern.toLowerCase()));
}

/**
 * Filter mocks based on config filters
 */
function filterMock(
  mock: PostmanMock,
  collectionName: string,
  filters: PostmanConfig['mockServerFilters']
): boolean {
  const mockName = mock.name.toLowerCase();
  const colName = collectionName.toLowerCase();

  // Check exclude patterns first
  if (matchesPatterns(mockName, filters.excludePatterns) ||
      matchesPatterns(colName, filters.excludePatterns)) {
    return false;
  }

  // Check include patterns
  return matchesPatterns(mockName, filters.namePatterns) ||
         matchesPatterns(colName, filters.collectionPatterns);
}

/**
 * Format mock server display name according to config
 */
function formatMockName(
  mockName: string,
  collectionName: string,
  workspaceName: string,
  format: string,
  showWorkspace: boolean,
  showCollection: boolean
): string {
  let displayName = format
    .replace('{mockName}', mockName)
    .replace('{collectionName}', showCollection ? collectionName : '')
    .replace('{workspaceName}', showWorkspace ? workspaceName : '');

  // Clean up extra spaces and parentheses
  displayName = displayName
    .replace(/\s*\(\s*\)/g, '') // Remove empty parentheses
    .replace(/\s+/g, ' ')        // Normalize spaces
    .trim();

  return displayName;
}

/**
 * Main function to fetch all mock servers using centralized config
 */
export async function getMockServers(): Promise<MockServer[]> {
  try {
    const config = await loadConfig();
    const allMocks: MockServer[] = [];

    // Process each enabled workspace
    for (const workspace of config.workspaces) {
      if (!workspace.enabled) {
        console.log(`Skipping disabled workspace: ${workspace.name}`);
        continue;
      }

      const apiKey = getApiKey(workspace.apiKeyEnvVar);
      if (!apiKey || apiKey.startsWith('your-')) {
        console.warn(`No API key found for ${workspace.name} (${workspace.apiKeyEnvVar})`);
        continue;
      }

      // Fetch collections and mocks in parallel
      const [collectionsMap, mocks] = await Promise.all([
        getCollectionsForWorkspace(workspace.id, apiKey),
        getMocksFromWorkspace(workspace.id, apiKey)
      ]);

      // Process each mock
      for (const mock of mocks) {
        const collectionUid = mock.collection;
        let collectionName = 'Unknown Collection';

        if (collectionUid && collectionsMap.has(collectionUid)) {
          collectionName = collectionsMap.get(collectionUid)!.name;
        }

        // Apply filters
        if (!filterMock(mock, collectionName, config.mockServerFilters)) {
          continue;
        }

        // Determine mock URL
        const mockUrl = mock.mockUrl ||
                       mock.config?.mockUrl ||
                       `https://${mock.id}.mock.pstmn.io`;

        // Format display name
        const displayName = formatMockName(
          mock.name,
          collectionName,
          workspace.name,
          config.displaySettings.nameFormat,
          config.displaySettings.showWorkspaceName,
          config.displaySettings.showCollectionName
        );

        allMocks.push({
          name: displayName,
          url: mockUrl,
          id: mock.id,
          collection: collectionName,
          workspace: workspace.name,
        });
      }
    }

    // Sort mocks according to config
    if (config.displaySettings.sortBy === 'name') {
      allMocks.sort((a, b) => a.name.localeCompare(b.name));
    }

    return allMocks;
  } catch (error) {
    console.error('Error fetching mock servers:', error);
    return [];
  }
}

/**
 * Get default mock server URL (fallback)
 */
export function getDefaultMockServerUrl(): string {
  return import.meta.env.VITE_DEFAULT_MOCK_URL ||
         'https://3f9ddaa4-be33-4d8d-9669-38c0f5434b65.mock.pstmn.io';
}

/**
 * Legacy function for backwards compatibility
 * @deprecated Use getMockServers() instead
 */
export async function getPostmanMockServers(workspaceType: 'personal' | 'team' = 'personal'): Promise<MockServer[] | null> {
  const servers = await getMockServers();
  return servers.length > 0 ? servers : null;
}

// Export types
export type { PostmanConfig };

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

export interface MockServer {
  name: string;
  url: string;
  id: string;
  collection: string;
  workspace: string;
}

export type WorkspaceType = 'personal' | 'team';

// Get API key based on workspace type
function getApiKey(workspaceType: WorkspaceType): string | null {
  if (workspaceType === 'team') {
    return import.meta.env.VITE_POSTMAN_API_KEY_TEAM || null;
  } else {
    return import.meta.env.VITE_POSTMAN_API_KEY_PERSONAL || null;
  }
}

// Fetch all collections from Postman
async function getAllPostmanCollections(apiKey: string): Promise<PostmanCollection[]> {
  try {
    const response = await fetch('https://api.getpostman.com/collections', {
      headers: {
        'X-Api-Key': apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch collections: ${response.statusText}`);
    }

    const data = await response.json();
    return data.collections || [];
  } catch (error) {
    console.error('Error fetching Postman collections:', error);
    throw error;
  }
}

// Fetch all mock servers from Postman
async function getAllPostmanMockServers(apiKey: string): Promise<PostmanMock[]> {
  try {
    const response = await fetch('https://api.getpostman.com/mocks', {
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
    console.error('Error fetching Postman mocks:', error);
    throw error;
  }
}

// Main function to fetch mock servers with collection association
export async function getPostmanMockServers(workspaceType: WorkspaceType = 'personal'): Promise<MockServer[] | null> {
  const apiKey = getApiKey(workspaceType);
  
  if (!apiKey) {
    console.warn(`No Postman API key found for ${workspaceType} workspace`);
    return null;
  }

  try {
    // Fetch collections and mocks in parallel
    const [collections, mocks] = await Promise.all([
      getAllPostmanCollections(apiKey),
      getAllPostmanMockServers(apiKey),
    ]);

    // Create a map of collection UID to collection info
    const collectionMap = new Map(
      collections.map(col => [col.uid, col])
    );

    // Build list of mocks with collection info
    const mockList: MockServer[] = mocks.map(mock => {
      const collectionUid = mock.collection;
      let collectionName = 'Unknown Collection';
      
      if (collectionUid && collectionMap.has(collectionUid)) {
        collectionName = collectionMap.get(collectionUid)!.name;
      }

      // Determine mock URL
      const mockUrl = mock.mockUrl || 
                     mock.config?.mockUrl || 
                     `https://${mock.id}.mock.pstmn.io`;
      
      return {
        name: `${mock.name} (${collectionName})`,
        url: mockUrl,
        id: mock.id,
        collection: collectionName,
        workspace: workspaceType,
      };
    });

    // Filter for C2M-related mocks (optional)
    const c2mMocks = mockList.filter(mock => 
      mock.name.toLowerCase().includes('c2m') || 
      mock.collection.toLowerCase().includes('c2m')
    );

    return c2mMocks.length > 0 ? c2mMocks : mockList;
  } catch (error) {
    console.error(`Error fetching mock servers for ${workspaceType} workspace:`, error);
    return null;
  }
}

// Function to get default mock server URL
export function getDefaultMockServerUrl(): string {
  return import.meta.env.VITE_DEFAULT_MOCK_URL || 
         'https://cd140b74-ed23-4980-834b-a966ac3393c1.mock.pstmn.io';
}
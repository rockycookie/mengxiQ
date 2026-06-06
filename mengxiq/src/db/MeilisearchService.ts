import { Meilisearch } from 'meilisearch';

const SEARCH_HOSTNAME = process.env.REACT_APP_API_HOSTNAME || 'raspberrypi.local';
const API_PORT = process.env.REACT_APP_API_PORT ? `:${process.env.REACT_APP_API_PORT}` : '';
const SEARCH_URL = `https://${SEARCH_HOSTNAME}${API_PORT}/api/search`;
const INDEX_NAME = 'search-report';

// Initialize Meilisearch client
const client = new Meilisearch({
  host: SEARCH_URL,
});

export interface SearchDocument {
  id: string;
  description: string;
  link: string;
}

/**
 * Load all report items to Meilisearch index
 * @param items Array of report items to index
 * @returns Promise that resolves when indexing is complete
 */
export async function loadReportsToSearch(items: SearchDocument[]): Promise<void> {
  try {
    // Get or create the index
    let index;
    try {
      index = await client.getIndex(INDEX_NAME);
    } catch (error) {
      // Index doesn't exist, create it
      await client.createIndex(INDEX_NAME, { primaryKey: 'id' });
      // Wait a bit for index creation
      await new Promise(resolve => setTimeout(resolve, 500));
      index = await client.getIndex(INDEX_NAME);
    }

    console.log(`Loading ${items.length} items to Meilisearch index "${INDEX_NAME}"...`);

    // Add or update documents in the index
    await index.addDocuments(items);
    
    // Wait for indexing to complete
    // For small datasets (<1MB), 3 seconds is more than enough
    await new Promise(resolve => setTimeout(resolve, 3000));
  } catch (error) {
    console.error('Error loading reports to Meilisearch:', error);
    throw error;
  }
}

/**
 * Search for documents in Meilisearch
 * @param query Search query string
 * @param limit Maximum number of results (default: 20)
 * @returns Promise that resolves with search results
 */
export async function searchReports(query: string, limit: number = 20): Promise<SearchDocument[]> {
  try {
    const index = await client.getIndex(INDEX_NAME);
    const searchResults = await index.search<SearchDocument>(query, {
      limit,
    });
    return searchResults.hits;
  } catch (error) {
    console.error('Error searching reports:', error);
    throw error;
  }
}

/**
 * Check if Meilisearch is available and healthy
 * @returns Promise that resolves to true if healthy, false otherwise
 */
export async function checkSearchHealth(): Promise<boolean> {
  try {
    const health = await client.health();
    return health.status === 'available';
  } catch (error) {
    console.error('Meilisearch health check failed:', error);
    return false;
  }
}

/**
 * Get statistics about the search index
 * @returns Promise that resolves with index stats
 */
export async function getIndexStats() {
  try {
    const index = await client.getIndex(INDEX_NAME);
    const stats = await index.getStats();
    return stats;
  } catch (error) {
    console.error('Error getting index stats:', error);
    return null;
  }
}

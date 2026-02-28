/**
 * Extract hostname from a URL
 * @param url - The URL to extract hostname from
 * @returns The hostname, or the original URL if parsing fails
 */
export function getHostname(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    return url; // If URL parsing fails, return the original URL
  }
}

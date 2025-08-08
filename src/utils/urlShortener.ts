/**
 * URL Shortener Utility for PDF Display
 * Provides professional URL shortening for PDF documents while maintaining full URL accessibility
 * 
 * @module URLShortener
 * @version 1.0.0
 * @author ATS Cover Letter Backend
 */

/**
 * Represents the result of URL shortening operation
 * @interface ShortUrlResult
 */
export interface ShortUrlResult {
  /** The shortened text to display in PDF */
  readonly displayText: string;
  /** The full URL for hyperlinking */
  readonly fullUrl: string;
  /** The platform type identified from the URL */
  readonly platform?: 'linkedin' | 'github' | 'medium' | 'unknown';
}

/**
 * URL shortening patterns for supported platforms
 * @private
 */
const URL_PATTERNS = {
  linkedin: {
    regex: /^https:\/\/(?:www\.)?linkedin\.com\/in\/([^\/\?#]+)/i,
    formatter: (username: string) => `linkedin/${username}`
  },
  github: {
    regex: /^https:\/\/(?:www\.)?github\.com\/([^\/\?#]+)/i,
    formatter: (username: string) => `github/${username}`
  },
  medium: {
    regex: /^https:\/\/(?:www\.)?medium\.com\/@([^\/\?#]+)/i,
    formatter: (username: string) => `medium/${username}`
  }
} as const;

/**
 * Validates and normalizes URL input, auto-completing partial URLs
 * @private
 * @param url - The URL to validate and normalize
 * @returns Normalized URL or null if invalid
 */
function validateAndNormalizeUrl(url: string): string | null {
  if (!url || typeof url !== 'string') {
    return null;
  }

  let trimmedUrl = url.trim();
  
  // Auto-complete common partial URLs
  if (trimmedUrl.startsWith('linkedin.com/in/')) {
    trimmedUrl = `https://www.${trimmedUrl}`;
  } else if (trimmedUrl.startsWith('github.com/')) {
    trimmedUrl = `https://${trimmedUrl}`;
  } else if (trimmedUrl.startsWith('medium.com/@')) {
    trimmedUrl = `https://${trimmedUrl}`;
  }
  
  // Basic URL validation
  try {
    new URL(trimmedUrl);
    return trimmedUrl;
  } catch {
    return null;
  }
}

/**
 * Shortens URLs for display in PDFs according to platform-specific rules
 * 
 * Supported platforms:
 * - LinkedIn: https://www.linkedin.com/in/username → linkedin/username
 * - GitHub: https://github.com/username → github/username  
 * - Medium: https://medium.com/@username → medium/username
 * 
 * @param fullUrl - The complete URL to shorten
 * @returns Shortened URL result with display text and full URL
 * @throws {Error} When URL is invalid or empty
 * 
 * @example
 * ```typescript
 * const result = shortenUrlForDisplay('https://www.linkedin.com/in/johndoe');
 * console.log(result.displayText); // "linkedin/johndoe"
 * console.log(result.fullUrl);     // "https://www.linkedin.com/in/johndoe"
 * console.log(result.platform);    // "linkedin"
 * ```
 */
export function shortenUrlForDisplay(fullUrl: string): ShortUrlResult {
  const normalizedUrl = validateAndNormalizeUrl(fullUrl);
  
  if (!normalizedUrl) {
    throw new Error(`Invalid URL provided: ${fullUrl}`);
  }

  // Check each platform pattern
  for (const [platform, config] of Object.entries(URL_PATTERNS)) {
    const match = normalizedUrl.match(config.regex);
    if (match && match[1]) {
      const username = match[1];
      return {
        displayText: config.formatter(username),
        fullUrl: normalizedUrl,
        platform: platform as keyof typeof URL_PATTERNS
      };
    }
  }

  // If no pattern matches, return the URL as-is with unknown platform
  return {
    displayText: normalizedUrl,
    fullUrl: normalizedUrl,
    platform: 'unknown'
  };
}

/**
 * Type guard to check if a URL is supported for shortening
 * @param url - The URL to check
 * @returns True if the URL can be shortened
 */
export function isSupportedUrl(url: string): boolean {
  try {
    const result = shortenUrlForDisplay(url);
    return result.platform !== 'unknown';
  } catch {
    return false;
  }
}
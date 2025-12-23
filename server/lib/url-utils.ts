/**
 * URL utility functions for handling UTF-8 nicknames in URLs
 * 
 * These functions encode/decode nicknames using base64-URL encoding
 * to safely handle Unicode characters in URLs, especially for non-English
 * nicknames (Korean, Japanese, Chinese, etc.)
 * 
 * This prevents issues with Safari, service workers, and push payload navigation.
 */

/**
 * Base64-URL encode a UTF-8 string for use in URLs
 * @param nickname - The nickname to encode (UTF-8 string)
 * @returns Base64-URL encoded string safe for URLs
 */
export function encodeNicknameForUrl(nickname: string): string {
  // Convert UTF-8 string to Uint8Array
  const utf8Bytes = new TextEncoder().encode(nickname);
  
  // Convert bytes to binary string
  const binaryString = String.fromCharCode(...utf8Bytes);
  
  // Convert to base64
  const base64 = btoa(binaryString);
  
  // Convert to base64-url format (replace + with -, / with _, remove trailing =)
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Decode a base64-URL encoded nickname back to UTF-8 string
 * @param encoded - The base64-URL encoded string
 * @returns The original UTF-8 nickname
 */
export function decodeNicknameFromUrl(encoded: string): string {
  // Convert from base64-url to base64 format
  let base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
  
  // Add padding if needed
  while (base64.length % 4 !== 0) {
    base64 += '=';
  }
  
  // Decode base64 to binary string
  const binaryString = atob(base64);
  
  // Convert binary string to Uint8Array
  const utf8Bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    utf8Bytes[i] = binaryString.charCodeAt(i);
  }
  
  // Decode UTF-8 bytes to string
  return new TextDecoder().decode(utf8Bytes);
}

/**
 * Build the full URL for a nickname detail page
 * @param nickname - The nickname to build URL for
 * @param baseUrl - Optional base URL (defaults to current origin)
 * @returns Full URL to nickname detail page
 */
export function buildNicknameUrl(nickname: string, baseUrl?: string): string {
  const encoded = encodeNicknameForUrl(nickname);
  const base = baseUrl || (typeof window !== 'undefined' ? window.location.origin : '');
  return `${base}/n/${encoded}`;
}

/**
 * Validate if a string is a valid base64-URL encoded nickname
 * @param encoded - The string to validate
 * @returns True if valid base64-URL encoding
 */
export function isValidEncodedNickname(encoded: string): boolean {
  try {
    // Try to decode - if it fails, it's invalid
    const decoded = decodeNicknameFromUrl(encoded);
    // Ensure the decoded string is valid UTF-8 and not empty
    return decoded.length > 0;
  } catch {
    return false;
  }
}
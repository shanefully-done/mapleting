package com.mapleting.monitor.utils

import android.util.Base64

/**
 * URL utility functions for handling UTF-8 nicknames in URLs
 * 
 * These functions encode/decode nicknames using base64-URL encoding
 * to safely handle Unicode characters in URLs, especially for non-English
 * nicknames (Korean, Japanese, Chinese, etc.)
 * 
 * This matches the server-side implementation in server/lib/url-utils.ts
 */
object UrlUtils {
    
    /**
     * Base64-URL encode a UTF-8 string for use in URLs
     * 
     * Process:
     * 1. Convert UTF-8 string to bytes
     * 2. Encode bytes using Base64 URL-safe encoding
     * 3. Remove padding characters (=)
     * 
     * @param nickname The nickname to encode (UTF-8 string)
     * @return Base64-URL encoded string safe for URLs
     */
    fun encodeNicknameForUrl(nickname: String): String {
        // Convert UTF-8 string to bytes
        val utf8Bytes = nickname.toByteArray(Charsets.UTF_8)
        
        // Encode using Base64 URL-safe (replaces + with -, / with _) and NO_WRAP (no newlines)
        val base64Encoded = Base64.encodeToString(
            utf8Bytes,
            Base64.URL_SAFE or Base64.NO_WRAP
        )
        
        // Remove padding characters (=) to match server behavior
        return base64Encoded.trimEnd('=')
    }
    
    /**
     * Decode a base64-URL encoded nickname back to UTF-8 string
     * 
     * @param encoded The base64-URL encoded string
     * @return The original UTF-8 nickname
     */
    fun decodeNicknameFromUrl(encoded: String): String {
        // Add padding back if needed (Base64 length must be multiple of 4)
        val paddingNeeded = (4 - encoded.length % 4) % 4
        val padded = encoded + "=".repeat(paddingNeeded)
        
        // Decode using Base64 URL-safe
        val decodedBytes = Base64.decode(padded, Base64.URL_SAFE or Base64.NO_WRAP)
        
        // Convert bytes back to UTF-8 string
        return String(decodedBytes, Charsets.UTF_8)
    }
    
    /**
     * Build the full URL for a nickname detail page
     * 
     * @param nickname The nickname to build URL for
     * @param serverUrl The server base URL (e.g., https://mapleting.vercel.app)
     * @return Full URL to nickname detail page (e.g., https://mapleting.vercel.app/n/7YyA65OU7J2Y)
     */
    fun buildNicknameUrl(nickname: String, serverUrl: String): String {
        val encoded = encodeNicknameForUrl(nickname)
        return "$serverUrl/n/$encoded"
    }
    
    /**
     * Validate if a string is a valid base64-URL encoded nickname
     * 
     * @param encoded The string to validate
     * @return True if valid base64-URL encoding that can be decoded
     */
    fun isValidEncodedNickname(encoded: String): Boolean {
        return try {
            val decoded = decodeNicknameFromUrl(encoded)
            decoded.isNotEmpty()
        } catch (e: Exception) {
            false
        }
    }
}
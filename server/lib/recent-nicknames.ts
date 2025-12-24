/**
 * Recently accessed nicknames management using localStorage
 * 
 * Stores the last 5 recently accessed nicknames with both encoded and decoded versions.
 * This allows users to quickly navigate back to recently viewed nicknames.
 */

export interface RecentNickname {
	encodedNickname: string;
	decodedNickname: string;
	timestamp: number;
}

const STORAGE_KEY = "recent-nicknames";
const MAX_RECENT_NICKNAMES = 5;

/**
 * Retrieve list of recent nicknames from localStorage
 * @returns Array of recent nicknames (max 5, sorted by most recent first)
 */
export function getRecentNicknames(): RecentNickname[] {
	if (typeof window === "undefined") {
		return [];
	}

	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (!stored) {
			return [];
		}

		const parsed: RecentNickname[] = JSON.parse(stored);
		// Sort by timestamp descending (most recent first)
		return parsed.sort((a, b) => b.timestamp - a.timestamp);
	} catch (error) {
		console.error("Error reading recent nicknames from localStorage:", error);
		return [];
	}
}

/**
 * Add a nickname to the recent list
 * - Maintains max 5 items
 * - Removes duplicates (moves existing to top if already in list)
 * - Saves to localStorage
 * 
 * @param encodedNickname - The base64-URL encoded nickname
 * @param decodedNickname - The UTF-8 decoded nickname for display
 */
export function addRecentNickname(
	encodedNickname: string,
	decodedNickname: string,
): void {
	if (typeof window === "undefined") {
		return;
	}

	try {
		const recent = getRecentNicknames();

		// Remove if already exists (to move it to top)
		const filtered = recent.filter(
			(item) => item.encodedNickname !== encodedNickname,
		);

		// Add new item at the beginning
		const newItem: RecentNickname = {
			encodedNickname,
			decodedNickname,
			timestamp: Date.now(),
		};

		const updated = [newItem, ...filtered];

		// Keep only the most recent 5
		const trimmed = updated.slice(0, MAX_RECENT_NICKNAMES);

		localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
	} catch (error) {
		console.error("Error saving recent nickname to localStorage:", error);
	}
}

/**
 * Clear all recent nicknames from localStorage
 */
export function clearRecentNicknames(): void {
	if (typeof window === "undefined") {
		return;
	}

	try {
		localStorage.removeItem(STORAGE_KEY);
	} catch (error) {
		console.error("Error clearing recent nicknames from localStorage:", error);
	}
}
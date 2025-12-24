"use client";

import { useEffect } from "react";
import { addRecentNickname } from "@/lib/recent-nicknames";

interface RecentNicknameTrackerProps {
	encodedNickname: string;
	decodedNickname: string;
}

/**
 * Client component that tracks when a nickname detail page is visited
 * and adds it to the recent nicknames list in localStorage
 */
export function RecentNicknameTracker({
	encodedNickname,
	decodedNickname,
}: RecentNicknameTrackerProps) {
	useEffect(() => {
		// Add to recent nicknames when component mounts
		addRecentNickname(encodedNickname, decodedNickname);
	}, [encodedNickname, decodedNickname]);

	// This component doesn't render anything
	return null;
}
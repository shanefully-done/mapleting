"use client";

import { Clock } from "lucide-react";
import { useEffect, useState } from "react";

interface TimestampDisplayProps {
	timestamp: number;
}

/**
 * Format timestamp to human-readable date in Korean locale
 */
function formatTimestamp(timestamp: number): string {
	const date = new Date(timestamp);

	// Format: "2025년 12월 23일 오후 5:07"
	return new Intl.DateTimeFormat("ko-KR", {
		month: "short",
		day: "numeric",
		year: "numeric",
		hour: "numeric",
		minute: "2-digit",
		hour12: true,
	}).format(date);
}

/**
 * Calculate relative time (e.g., "2 minutes ago")
 */
function getRelativeTime(timestamp: number): string {
	const now = Date.now();
	const diff = now - timestamp;

	const seconds = Math.floor(diff / 1000);
	const minutes = Math.floor(seconds / 60);
	const hours = Math.floor(minutes / 60);
	const days = Math.floor(hours / 24);

	if (seconds < 60) {
		return "방금 전";
	} else if (minutes < 60) {
		return `${minutes}분 전`;
	} else if (hours < 24) {
		return `${hours}시간 전`;
	} else {
		return `${days}일 전`;
	}
}

/**
 * Client component that displays formatted timestamp with relative time.
 * Uses client's local timezone for accurate time display.
 */
export function TimestampDisplay({ timestamp }: TimestampDisplayProps) {
	const [relativeTime, setRelativeTime] = useState<string>(() =>
		getRelativeTime(timestamp)
	);
	const [formattedTime] = useState<string>(() => formatTimestamp(timestamp));

	// Update relative time every minute to keep it accurate
	useEffect(() => {
		const interval = setInterval(() => {
			setRelativeTime(getRelativeTime(timestamp));
		}, 60000); // Update every minute

		return () => clearInterval(interval);
	}, [timestamp]);

	return (
		<div className="flex items-center gap-2 text-sm text-muted-foreground">
			<Clock className="h-4 w-4" />
			<span>
				마지막 상태 변동: {relativeTime} ({formattedTime})
			</span>
		</div>
	);
}
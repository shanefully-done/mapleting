"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getRecentNicknames, clearRecentNicknames } from "@/lib/recent-nicknames";
import type { RecentNickname } from "@/lib/recent-nicknames";
import { Clock, Trash2 } from "lucide-react";

/**
 * Client component that displays recently accessed nicknames
 * Reads from localStorage and shows up to 5 most recent nicknames
 */
export function RecentNicknamesList() {
	const [recentNicknames, setRecentNicknames] = useState<RecentNickname[]>([]);

	// Load recent nicknames on mount
	useEffect(() => {
		setRecentNicknames(getRecentNicknames());
	}, []);

	// Listen for storage changes (in case user has multiple tabs open)
	useEffect(() => {
		const handleStorageChange = () => {
			setRecentNicknames(getRecentNicknames());
		};

		window.addEventListener("storage", handleStorageChange);
		return () => window.removeEventListener("storage", handleStorageChange);
	}, []);

	const handleClear = () => {
		clearRecentNicknames();
		setRecentNicknames([]);
	};

	if (recentNicknames.length === 0) {
		return null;
	}

	return (
		<Card className="border-primary/20 bg-primary/5">
			<CardHeader>
				<div className="flex items-start justify-between">
					<div className="space-y-1">
						<CardTitle className="flex items-center gap-2">
							<Clock className="h-5 w-5" />
							최근 조회한 캐릭터
						</CardTitle>
						<CardDescription>
							최근 {recentNicknames.length}개의 캐릭터를 조회했습니다
						</CardDescription>
					</div>
					<Button
						variant="ghost"
						size="sm"
						onClick={handleClear}
						className="text-muted-foreground hover:text-destructive"
					>
						<Trash2 className="h-4 w-4" />
					</Button>
				</div>
			</CardHeader>
			<CardContent>
				<div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
					{recentNicknames.map((item) => (
						<Link
							key={item.encodedNickname}
							href={`/n/${item.encodedNickname}`}
							className="group"
						>
							<div className="p-3 rounded-lg border border-border bg-card hover:bg-accent hover:border-primary/50 transition-all duration-200">
								<div className="flex items-center justify-between gap-2">
									<div className="flex-1 min-w-0">
										<p className="font-medium text-sm truncate group-hover:text-primary transition-colors">
											{item.decodedNickname}
										</p>
									</div>
								</div>
							</div>
						</Link>
					))}
				</div>
			</CardContent>
		</Card>
	);
}
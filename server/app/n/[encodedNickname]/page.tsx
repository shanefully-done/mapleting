import { notFound } from "next/navigation";
import { Metadata } from "next";
import { decodeNicknameFromUrl } from "@/lib/url-utils";
import { createClient } from "@/lib/db";
import { SubscriptionButton } from "@/components/subscription-button";
import { PWAInstallButton } from "@/components/pwa-install-button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock, CheckCircle2, XCircle } from "lucide-react";
import Link from "next/link";

interface PageProps {
	params: Promise<{
		encodedNickname: string;
	}>;
}

/**
 * Generate metadata for the nickname detail page
 */
export async function generateMetadata({
	params,
}: PageProps): Promise<Metadata> {
	const { encodedNickname } = await params;

	try {
		const nickname = decodeNicknameFromUrl(encodedNickname);
		return {
			title: `${nickname} - 메이플팅`,
			description: `${nickname} 모니터링 및 알림 수신`,
		};
	} catch {
		return {
			title: "캐릭터를 찾을 수 없음 - 메이플팅",
			description: "요청한 캐릭터를 찾을 수 없습니다",
		};
	}
}

/**
 * Fetch nickname data from the database
 */
async function getNicknameData(nickname: string) {
	try {
		const supabase = await createClient();

		const { data, error } = await supabase
			.from("nicknames")
			.select("*")
			.eq("nickname", nickname)
			.single();

		if (error) {
			console.error("Error fetching nickname:", error);
			return null;
		}

		return data;
	} catch (error) {
		console.error("Database error:", error);
		return null;
	}
}

/**
 * Format timestamp to human-readable date
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

export default async function NicknameDetailPage({ params }: PageProps) {
	const { encodedNickname } = await params;

	let nickname: string;
	try {
		nickname = decodeNicknameFromUrl(encodedNickname);
	} catch (error) {
		console.error("Failed to decode nickname:", error);
		notFound();
	}

	// Fetch nickname data from database
	const nicknameData = await getNicknameData(nickname);

	// If nickname not found, show 404
	if (!nicknameData) {
		notFound();
	}

	const isConnected = nicknameData.last_status === "connected";
	const relativeTime = getRelativeTime(nicknameData.last_seen_at);
	const formattedTime = formatTimestamp(nicknameData.last_seen_at);

	return (
		<div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
			{/* Header */}
			<header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
				<div className="container mx-auto px-4 py-6">
					<Link href="/">
						<Button variant="ghost" size="sm" className="gap-2">
							<ArrowLeft className="h-4 w-4" />
							홈으로
						</Button>
					</Link>
				</div>
			</header>

			{/* Main Content */}
			<main className="container mx-auto px-4 py-12">
				<div className="max-w-2xl mx-auto space-y-6">
					{/* Device Info Card */}
					<Card>
						<CardHeader>
							<div className="flex items-start justify-between">
								<div className="space-y-1">
									<CardTitle className="text-2xl">{nickname}</CardTitle>
									<CardDescription>
										게임이 완전히 튕긴 경우에만 감지됩니다
									</CardDescription>
								</div>
								<Badge
									variant={isConnected ? "default" : "destructive"}
									className="gap-1.5 text-sm"
								>
									{isConnected ? (
										<>
											<CheckCircle2 className="h-3.5 w-3.5" />
											연결됨
										</>
									) : (
										<>
											<XCircle className="h-3.5 w-3.5" />
											연결 끊김
										</>
									)}
								</Badge>
							</div>
						</CardHeader>
						<CardContent className="space-y-4">
							{/* Status Description */}
							<div className="p-4 rounded-lg bg-muted/50">
								<p className="text-sm">
									{isConnected ? (
										<>
											<span className="font-semibold text-green-600 dark:text-green-400">
												디바이스가 온라인 상태입니다
											</span>{" "}
											오프라인이 되면 알림을 받게 됩니다.
										</>
									) : (
										<>
											<span className="font-semibold text-red-600 dark:text-red-400">
												디바이스가 오프라인 상태입니다
											</span>{" "}
											점검이 필요할 수 있습니다.
										</>
									)}
								</p>
							</div>

							{/* Last Seen Info */}
							<div className="flex items-center gap-2 text-sm text-muted-foreground">
								<Clock className="h-4 w-4" />
								<span>
									마지막 상태 변동: {relativeTime} ({formattedTime})
								</span>
							</div>
						</CardContent>
					</Card>

					{/* Subscription Card */}
					<Card>
						<CardHeader>
							<CardTitle>알림</CardTitle>
							<CardDescription>
								이 캐릭터가 튕길 경우 푸시 알림을 받으려면 구독하세요
							</CardDescription>
						</CardHeader>
						<CardContent>
							<SubscriptionButton nickname={nickname} />
						</CardContent>
					</Card>

					{/* PWA Install Prompt */}
					<PWAInstallButton />

					{/* Info Card */}
					<Card className="bg-primary/5 border-primary/20">
						<CardHeader>
							<CardTitle className="text-base">알림 작동 방식</CardTitle>
						</CardHeader>
						<CardContent className="space-y-2 text-sm text-muted-foreground">
							<p>• 캐릭터가 연결됨에서 연결 끊김으로 전환되면 푸시 알림을 받습니다</p>
							<p>
								• 모바일은 앱을 설치해야 이 페이지가 닫혀 있거나 브라우저가 실행되지
								않아도 알림이 작동합니다
							</p>
						</CardContent>
					</Card>
				</div>
			</main>
		</div>
	);
}

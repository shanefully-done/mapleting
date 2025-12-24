import { Metadata } from "next";
import { decodeNicknameFromUrl } from "@/lib/url-utils";
import { createClient } from "@/lib/db";
import { SubscriptionButton } from "@/components/subscription-button";
import { PWAInstallBanner } from "@/components/pwa-install-button";
import { NicknameStatusCard } from "@/components/nickname-status-card";
import { RecentNicknameTracker } from "@/components/recent-nickname-tracker";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, XCircle } from "lucide-react";
import Link from "next/link";

interface PageProps {
	params: Promise<{
		encodedNickname: string;
	}>;
	searchParams: Promise<{
		error?: string;
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
			title: "메이플팅",
			description: "캐릭터 모니터링 및 알림 수신",
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
			.maybeSingle();

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

export default async function NicknameDetailPage({ params }: PageProps) {
	const { encodedNickname } = await params;

	let nickname: string;
	let decodeError = false;
	
	try {
		nickname = decodeNicknameFromUrl(encodedNickname);
	} catch (error) {
		console.error("Failed to decode nickname:", error);
		decodeError = true;
		nickname = encodedNickname; // Use encoded value as fallback for display
	}

	// Fetch nickname data from database
	const nicknameData = !decodeError ? await getNicknameData(nickname) : null;

	// If nickname not found or invalid, show error page
	if (decodeError || !nicknameData) {
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
					<div className="max-w-2xl mx-auto">
						{/* Error Card */}
						<Card className="border-destructive/50 bg-destructive/10">
							<CardHeader>
								<div className="flex items-start gap-3">
									<XCircle className="h-6 w-6 text-destructive flex-shrink-0 mt-1" />
									<div className="space-y-2">
										<CardTitle className="text-destructive">
											{decodeError ? "잘못된 닉네임 형식" : "캐릭터를 찾을 수 없음"}
										</CardTitle>
										<CardDescription>
											{decodeError
												? "입력된 닉네임 형식이 올바르지 않습니다."
												: `"${nickname}" 캐릭터를 찾을 수 없습니다.`}
										</CardDescription>
									</div>
								</div>
							</CardHeader>
							<CardContent className="space-y-4">
								{!decodeError && (
									<div className="p-4 rounded-lg bg-muted/50">
										<p className="text-sm">
											<span className="font-semibold">가능한 이유:</span>
										</p>
										<ul className="text-sm text-muted-foreground list-disc list-inside space-y-1 mt-2">
											<li>모니터링 클라이언트가 실행 중이지 않습니다</li>
											<li>닉네임이 올바르지 않습니다</li>
											<li>아직 모니터링이 시작되지 않았습니다</li>
										</ul>
									</div>
								)}
								<div className="flex flex-col sm:flex-row gap-2">
									<Link href="/" className="flex-1">
										<Button className="w-full">홈으로 가기</Button>
									</Link>
									<Link href="/setup" className="flex-1">
										<Button variant="outline" className="w-full">
											설정 가이드 보기
										</Button>
									</Link>
								</div>
							</CardContent>
						</Card>
					</div>
				</main>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
			{/* Track this nickname visit in recent history */}
			<RecentNicknameTracker
				encodedNickname={encodedNickname}
				decodedNickname={nickname}
			/>

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
					{/* Device Info Card with Refresh */}
					<NicknameStatusCard initialData={nicknameData} />

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
					<PWAInstallBanner />

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

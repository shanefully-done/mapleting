"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { encodeNicknameForUrl } from "@/lib/url-utils";
import { Bell, BookOpen, ArrowRight, Github, Globe } from "lucide-react";
import { PWAInstallBanner } from "@/components/pwa-install-button";
import { ErrorAlertWithSuspense } from "@/components/error-alert";
import { RecentNicknamesList } from "@/components/recent-nicknames-list";
import Link from "next/link";

export default function Home() {
	const [nickname, setNickname] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const router = useRouter();

	const handleSubscribe = () => {
		if (!nickname.trim()) {
			return;
		}

		setIsLoading(true);

		// Encode the nickname and navigate to detail page
		const encoded = encodeNicknameForUrl(nickname.trim());
		router.push(`/n/${encoded}`);
	};

	const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter") {
			handleSubscribe();
		}
	};

	return (
		<div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
			{/* Header */}
			<header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
				<div className="container mx-auto px-4 py-6 flex items-center justify-between">
					<div className="flex items-center gap-2">
						<Bell className="h-6 w-6 text-primary" />
						<h1 className="text-xl font-bold">MapleTing</h1>
					</div>
					<Link href="/setup">
						<Button variant="outline" size="sm" className="gap-2">
							<BookOpen className="h-4 w-4" />
							설정 가이드
						</Button>
					</Link>
				</div>
			</header>

			{/* Main Content */}
			<main className="container mx-auto px-4 py-12">
				<div className="max-w-4xl mx-auto space-y-12">
					{/* Error Alert */}
					<ErrorAlertWithSuspense />

					{/* Hero Section */}
					<div className="text-center space-y-4">
						<h2 className="text-4xl font-bold tracking-tight sm:text-5xl">
							아 또 팅겻내! 아 킹받내!
						</h2>
						<p className="text-xl text-muted-foreground max-w-2xl mx-auto">
							안드로이드 및 에뮬레이터에서 메키가 꺼지면 푸쉬 알림을 보내드립니다.
						</p>
					</div>

					{/* Subscribe Card */}
					<Card className="border-2">
						<CardHeader>
							<div className="flex flex-col gap-4">
								{/* Version Announcement Alert */}
								<a
									href="https://github.com/shanefully-done/mapleting/releases"
									target="_blank"
									rel="noopener noreferrer"
									className="block"
								>
									<div
										className="flex items-center bg-blue-500 text-white text-sm font-bold px-4 py-3"
										role="alert"
									>
										<p className="font-semibold text-sm flex items-center justify-center gap-2">
											<svg
												className="fill-current w-4 h-4 mr-2"
												xmlns="http://www.w3.org/2000/svg"
												viewBox="0 0 20 20"
											>
												<path d="M12.432 0c1.34 0 2.01.912 2.01 1.957 0 1.305-1.164 2.512-2.679 2.512-1.269 0-2.009-.75-1.974-1.99C9.789 1.436 10.67 0 12.432 0zM8.309 20c-1.058 0-1.833-.652-1.093-3.524l1.214-5.092c.211-.814.246-1.141 0-1.141-.317 0-1.689.562-2.502 1.117l-.528-.88c2.572-2.186 5.531-3.467 6.801-3.467 1.057 0 1.233 1.273.705 3.23l-1.391 5.352c-.246.945-.141 1.271.106 1.271.317 0 1.357-.392 2.379-1.207l.6.814C12.098 19.02 9.365 20 8.309 20z" />
											</svg>
											<span>안드로이드 앱을 v0.1.3로 업데이트 해주세요!</span>
											<span>클릭하면 다운로드 페이지로 이동합니다.</span>
										</p>
									</div>
								</a>

								<div>
									<CardTitle>캐릭터 조회</CardTitle>
									<CardDescription>
										알림을 받을 캐릭터의 닉네임을 입력하세요
									</CardDescription>
								</div>
							</div>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="flex gap-2">
								<Input
									type="text"
									placeholder="캐릭터 닉네임 입력 (예: 에스프레소)"
									value={nickname}
									onChange={(e) => setNickname(e.target.value)}
									onKeyDown={handleKeyPress}
									disabled={isLoading}
									className="flex-1"
								/>
								<Button
									onClick={handleSubscribe}
									disabled={isLoading || !nickname.trim()}
									size="lg"
								>
									{isLoading ? "로딩 중..." : "조회"}
								</Button>
							</div>
						</CardContent>
					</Card>

					{/* Recent Nicknames */}
					<RecentNicknamesList />

					{/* Setup Guide CTA */}
					<Card className="border-primary/20 bg-primary/5">
						<CardHeader>
							<CardTitle>시작하기</CardTitle>
							<CardDescription>
								먼저 모니터링 앱을 설치하고 알림을 받아보세요
							</CardDescription>
						</CardHeader>
						<CardContent>
							<p className="text-sm text-muted-foreground mb-4">
								메이플팅은 안드로이드 모니터링 앱과 함께 작동합니다. 앱 설치 및 설정
								방법을 확인하세요.
							</p>
							<Link href="/setup">
								<Button className="w-full sm:w-auto gap-2">
									<BookOpen className="h-4 w-4" />
									설정 가이드 보기
									<ArrowRight className="h-4 w-4" />
								</Button>
							</Link>
						</CardContent>
					</Card>

					{/* How it Works */}
					<Card>
						<CardHeader>
							<CardTitle>알림 구독 방법</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<ol className="list-decimal list-inside space-y-2 text-sm">
								<li>
									<strong>
										<Link href="/">설정 가이드 확인</Link>
									</strong>{" "}
									- 안드로이드에 모니터링 앱을 설치하고 설정하세요
								</li>
								<li>
									<strong>알림 받을 기기로 접속</strong> - 알림을 받을 기기로{" "}
									<Link href="/">이 웹페이지</Link>를 방문하세요
								</li>
								<li>
									<strong>캐릭터 닉네임 입력</strong> - 위 캐릭터명 입력창에 닉네임을
									입력하고 &ldquo;조회&rdquo; 버튼을 클릭하세요
								</li>
								<li>
									<strong>알림 활성화</strong> - 브라우저에서 푸시 알림을 허용하세요
								</li>
								<li>
									<strong>알림 수신</strong> - 메이플키우기가 팅기면 즉시 알림을 받습니다
								</li>
								<li>
									<strong>앱으로 설치</strong> - 아이폰/아이패드는 사파리에서 홈 화면에
									이 사이트를 추가하해야 작동합니다
								</li>
							</ol>
						</CardContent>
					</Card>

					{/* PWA Install Prompt */}
					<PWAInstallBanner />
				</div>
			</main>

			{/* Footer */}
			<footer className="border-t mt-12">
				<div className="container mx-auto px-4 py-6">
					<div className="flex flex-col items-center gap-4 text-sm text-muted-foreground">
						<p>© {new Date().getFullYear()} Shane Lx. All rights reserved.</p>
						<div className="flex items-center gap-4">
							<a
								href="https://github.com/shanefully-done/mapleting"
								target="_blank"
								rel="noopener noreferrer"
								className="flex items-center gap-1.5 hover:text-foreground transition-colors"
							>
								<Github className="h-4 w-4" />
								<span>GitHub</span>
							</a>
							<a
								href="https://www.ixtj.dev/"
								target="_blank"
								rel="noopener noreferrer"
								className="flex items-center gap-1.5 hover:text-foreground transition-colors"
							>
								<Globe className="h-4 w-4" />
								<span>Blog</span>
							</a>
						</div>
					</div>
				</div>
			</footer>
		</div>
	);
}

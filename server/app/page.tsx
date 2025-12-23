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
							아 또 팅겻내
						</h2>
						<p className="text-xl text-muted-foreground max-w-2xl mx-auto">
							블루스택, LD, 뮤뮤, Nox 등의 에뮬레이터로 돌리는 메키가 닫히면 푸쉬
							알림을 보내드립니다.
						</p>
					</div>

					{/* Subscribe Card */}
					<Card className="border-2">
						<CardHeader>
							<CardTitle>캐릭터 조회</CardTitle>
							<CardDescription>
								알림을 받을 캐릭터의 닉네임을 입력하세요
							</CardDescription>
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

					{/* Setup Guide CTA */}
					<Card className="border-primary/20 bg-primary/5">
						<CardHeader>
							<CardTitle>시작하기</CardTitle>
							<CardDescription>
								모니터링 클라이언트를 설치하고 알림을 받아보세요
							</CardDescription>
						</CardHeader>
						<CardContent>
							<p className="text-sm text-muted-foreground mb-4">
								메이플팅은 PC에서 실행되는 모니터링 클라이언트와 함께 작동합니다.
								ADB 설정 및 클라이언트 설치 방법을 확인하세요.
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
									<strong>설정 가이드 확인</strong> - 모니터링 클라이언트를
									설치하고 설정하세요
								</li>
								<li>
									<strong>캐릭터 닉네임 입력</strong> - 위 입력창에 캐릭터 닉네임을
									입력하고 &ldquo;조회&rdquo; 버튼을 클릭하세요
								</li>
								<li>
									<strong>알림 활성화</strong> - 브라우저에서 푸시 알림을 허용하세요
								</li>
								<li>
									<strong>알림 수신</strong> - 디바이스가 오프라인되면 즉시 알림을
									받습니다
								</li>
								<li>
									<strong>앱으로 설치</strong> - 모바일은 홈 화면에 추가하세요
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
"use client";

import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { X, Share2, Plus, Smartphone } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
	prompt: () => Promise<void>;
	userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

// Extend Navigator interface to include iOS-specific standalone property
declare global {
	interface Navigator {
		standalone?: boolean;
	}
}

export function PWAInstallBanner() {
	const [deferredPrompt, setDeferredPrompt] =
		useState<BeforeInstallPromptEvent | null>(null);
	const [isVisible, setIsVisible] = useState(false);
	const [isInstalled, setIsInstalled] = useState(false);
	const [isIOS, setIsIOS] = useState(false);

	useEffect(() => {
		if (typeof window === "undefined") return;

		const isStandalone =
			window.matchMedia("(display-mode: standalone)").matches ||
			window.navigator.standalone === true;

		if (isStandalone) {
			setIsInstalled(true);
			return;
		}

		// iOS Detection
		const isIOSDevice =
			/iPad|iPhone|iPod/.test(navigator.userAgent) &&
			!window.navigator.standalone;
		setIsIOS(isIOSDevice);

		// Show iOS instructions after a short delay if not installed
		if (isIOSDevice) {
			const timer = setTimeout(() => setIsVisible(true), 2000);
			return () => clearTimeout(timer);
		}

		const handleBeforeInstallPrompt = (e: Event) => {
			e.preventDefault();
			setDeferredPrompt(e as BeforeInstallPromptEvent);
			setIsVisible(true);
		};

		window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
		return () =>
			window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
	}, []);

	const handleInstall = async () => {
		if (!deferredPrompt) return;
		deferredPrompt.prompt();
		const { outcome } = await deferredPrompt.userChoice;
		if (outcome === "accepted") setIsVisible(false);
		setDeferredPrompt(null);
	};

	if (isInstalled || !isVisible) return null;

	return (
		<div className="fixed bottom-4 left-0 right-0 z-50 px-4 animate-in fade-in slide-in-from-bottom-5 duration-500 sm:left-auto sm:right-4 sm:max-w-sm">
			<Card className="overflow-hidden border-none shadow-2xl ring-1 ring-black/5 bg-background/95 backdrop-blur-md">
				<div className="p-4">
					<div className="flex items-start gap-4">
						<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
							<Smartphone className="h-6 w-6" />
						</div>

						<div className="flex-1">
							<div className="flex items-center justify-between">
								<h3 className="font-semibold text-sm tracking-tight text-foreground">
									앱으로 설치하기
								</h3>
								<button
									onClick={() => setIsVisible(false)}
									className="rounded-full p-1 text-muted-foreground hover:bg-muted transition-colors"
								>
									<X className="h-4 w-4" />
								</button>
							</div>

							<p className="mt-1 text-xs leading-relaxed text-muted-foreground">
								{isIOS
									? "Safari 브라우저에서 홈 화면에 추가하여 더 편하게 이용하세요."
									: "홈 화면에 추가하여 오프라인에서도 끊김 없이 이용해 보세요."}
							</p>

							{isIOS ? (
								<div className="mt-4 grid grid-cols-2 gap-2">
									<div className="flex items-center gap-2 rounded-lg border bg-muted/50 p-2 text-[11px] font-medium">
										<Share2 className="h-3.5 w-3.5 text-blue-500" />
										<span>공유 버튼 탭</span>
									</div>
									<div className="flex items-center gap-2 rounded-lg border bg-muted/50 p-2 text-[11px] font-medium">
										<Plus className="h-3.5 w-3.5 text-primary" />
										<span>홈 화면 추가</span>
									</div>
								</div>
							) : (
								<div className="mt-4 flex gap-2">
									<Button
										onClick={handleInstall}
										size="sm"
										className="flex-1 rounded-lg text-xs font-semibold shadow-sm"
									>
										지금 설치
									</Button>
									<Button
										onClick={() => setIsVisible(false)}
										variant="outline"
										size="sm"
										className="flex-1 rounded-lg text-xs font-semibold"
									>
										나중에
									</Button>
								</div>
							)}
						</div>
					</div>
				</div>
				{/* Subtle Progress Bar (Optional Decoration) */}
				<div className="h-1 w-full bg-primary/20">
					<div className="h-full w-1/3 bg-primary animate-pulse" />
				</div>
			</Card>
		</div>
	);
}

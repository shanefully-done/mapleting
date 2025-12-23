"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
	Card,
	CardContent,
} from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

function ErrorAlert() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const error = searchParams.get("error");

	// Clear error from URL after displaying
	useEffect(() => {
		if (error) {
			// Replace URL to remove error param after showing message
			router.replace("/", { scroll: false });
		}
	}, [error, router]);

	const getErrorMessage = (errorType: string | null) => {
		switch (errorType) {
			case "invalid_nickname":
				return "잘못된 캐릭터 닉네임 형식입니다.";
			case "not_found":
				return "해당 캐릭터를 찾을 수 없습니다. 모니터링 클라이언트가 실행 중인지 확인해주세요.";
			default:
				return null;
		}
	};

	const errorMessage = getErrorMessage(error);

	if (!errorMessage) {
		return null;
	}

	return (
		<Card className="border-destructive/50 bg-destructive/10">
			<CardContent className="flex items-start gap-3 pt-6">
				<AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
				<div>
					<p className="text-sm font-medium text-destructive">
						{errorMessage}
					</p>
					<p className="text-xs text-muted-foreground mt-1">
						<Link href="/setup" className="text-primary hover:underline">
							설정 가이드
						</Link>
						를 확인해주세요.
					</p>
				</div>
			</CardContent>
		</Card>
	);
}

export function ErrorAlertWithSuspense() {
	return (
		<Suspense fallback={null}>
			<ErrorAlert />
		</Suspense>
	);
}
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, RefreshCw, Clock } from "lucide-react";
import { TimestampDisplay } from "@/components/timestamp-display";

interface UptimeDisplayProps {
	timestamp: number;
}

function UptimeDisplay({ timestamp }: UptimeDisplayProps) {
	const [uptime, setUptime] = useState({
		days: 0,
		hours: 0,
		minutes: 0,
		seconds: 0,
	});

	useEffect(() => {
		const calculateUptime = () => {
			const now = Date.now();
			const diff = now - timestamp;

			const days = Math.floor(diff / (1000 * 60 * 60 * 24));
			const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
			const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
			const seconds = Math.floor((diff % (1000 * 60)) / 1000);

			setUptime({ days, hours, minutes, seconds });
		};

		calculateUptime();
		const interval = setInterval(calculateUptime, 1000);

		return () => clearInterval(interval);
	}, [timestamp]);

	const formatUptime = () => {
		const parts = [];
		if (uptime.days > 0) parts.push(`${uptime.days}일`);
		if (uptime.hours > 0) parts.push(`${uptime.hours}시간`);
		if (uptime.minutes > 0) parts.push(`${uptime.minutes}분`);
		parts.push(`${uptime.seconds}초`);
		return parts.join(" ");
	};

	return (
		<div className="flex items-center gap-2 text-sm text-muted-foreground">
			<Clock className="h-4 w-4" />
			<span>
				경과 시간: {formatUptime()}
			</span>
		</div>
	);
}

interface NicknameData {
	nickname: string;
	last_status: "connected" | "disconnected";
	last_seen_at: number;
}

interface NicknameStatusCardProps {
	initialData: NicknameData;
}

const REFRESH_COOLDOWN_MS = 5000; // 5 seconds

export function NicknameStatusCard({ initialData }: NicknameStatusCardProps) {
	const [data, setData] = useState<NicknameData>(initialData);
	const [isLoading, setIsLoading] = useState(false);
	const [canRefresh, setCanRefresh] = useState(true);
	const [cooldownRemaining, setCooldownRemaining] = useState(0);

	const isConnected = data.last_status === "connected";

	// Handle cooldown timer
	useEffect(() => {
		if (cooldownRemaining > 0) {
			const timer = setTimeout(() => {
				setCooldownRemaining(cooldownRemaining - 1000);
			}, 1000);
			return () => clearTimeout(timer);
		} else if (!canRefresh) {
			setCanRefresh(true);
		}
	}, [cooldownRemaining, canRefresh]);

	const handleRefresh = async () => {
		if (!canRefresh || isLoading) return;

		setIsLoading(true);
		setCanRefresh(false);
		setCooldownRemaining(REFRESH_COOLDOWN_MS);

		try {
			const response = await fetch(`/api/nickname?nickname=${encodeURIComponent(data.nickname)}`);
			
			if (!response.ok) {
				throw new Error("Failed to fetch nickname data");
			}

			const newData = await response.json();
			
			if (newData.data) {
				setData(newData.data);
			}
		} catch (error) {
			console.error("Error refreshing nickname data:", error);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<Card>
			<CardHeader>
				<div className="flex items-start justify-between">
					<div className="space-y-1">
						<CardTitle className="text-2xl">{data.nickname}</CardTitle>
						<CardDescription>
							게임이 완전히 튕긴 경우에만 감지됩니다
						</CardDescription>
					</div>
					<div className="flex items-center gap-2">
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
						<Button
							variant="outline"
							size="icon"
							onClick={handleRefresh}
							disabled={!canRefresh || isLoading}
							className="relative"
							title={
								canRefresh
									? "새로고침"
									: `${Math.ceil(cooldownRemaining / 1000)}초 후 다시 새로고침 가능`
							}
						>
							<RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
						</Button>
					</div>
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

				{/* Uptime Tracker */}
				<UptimeDisplay timestamp={data.last_seen_at} />

				{/* Last Seen Info */}
				<TimestampDisplay timestamp={data.last_seen_at} />
			</CardContent>
		</Card>
	);
}
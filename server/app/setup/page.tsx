import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { ArrowLeft, BookOpen, Download, Settings, Bell } from "lucide-react";
import Link from "next/link";

export default function SetupPage() {
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
				<div className="max-w-4xl mx-auto space-y-8">
					{/* Page Title */}
					<div className="text-center space-y-2">
						<h1 className="text-3xl font-bold tracking-tight">
							설정 가이드
						</h1>
						<p className="text-muted-foreground">
							모니터링 클라이언트 설치 및 설정 방법
						</p>
					</div>

					{/* Quick Overview */}
					<Card className="border-primary/20 bg-primary/5">
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Bell className="h-5 w-5" />
								메이플팅이란?
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-2 text-sm">
							<p>
								메이플팅은 PC에서 실행되는 모니터링 클라이언트와 웹 푸시
								알림을 통해, 에뮬레이터나 기기에서 메이플스토리가 완전히
								튕긴 경우 알림을 받을 수 있는 서비스입니다.
							</p>
							<p className="text-muted-foreground">
								<strong>💡 모니터링 클라이언트란?</strong> PC에서 실행되는
								작은 프로그램으로, ADB(Android Debug Bridge)를 사용하여
								에뮬레이터나 기기에서 게임이 실행 중인지 확인하고 서버에
								알려줍니다.
							</p>
						</CardContent>
					</Card>

					{/* ADB Setup Instructions */}
					<Card className="border-2">
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Settings className="h-5 w-5" />
								ADB 설정 (필수)
							</CardTitle>
							<CardDescription>
								모니터링 클라이언트는 ADB를 사용하여 에뮬레이터의 게임 상태를
								확인합니다
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-6">
							{/* Windows ADB Setup */}
							<div className="space-y-3">
								<h3 className="font-semibold text-base">
									1. ADB 설치 (Windows)
								</h3>
								<ol className="list-decimal list-inside space-y-3 text-sm">
									<li className="pl-2">
										<span className="font-medium">
											Android Platform Tools 다운로드
										</span>
										<div className="mt-1 ml-4 text-muted-foreground">
											<a
												href="https://developer.android.com/tools/releases/platform-tools"
												target="_blank"
												rel="noopener noreferrer"
												className="text-primary hover:underline"
											>
												Google 공식 페이지
											</a>{" "}
											에서 Windows용 Platform Tools를 다운로드하세요.
										</div>
									</li>
									<li className="pl-2">
										<span className="font-medium">
											압축 해제 및 폴더 이동
										</span>
										<div className="mt-1 ml-4 text-muted-foreground space-y-1">
											<p>• 다운로드한 zip 파일을 압축 해제합니다</p>
											<p>• 폴더를 C:\adb 경로로 이동합니다</p>
											<p className="text-xs bg-muted p-2 rounded">
												팁: C:\adb 같이 경로에 공백이 없는 곳을 추천합니다
											</p>
										</div>
									</li>
									<li className="pl-2">
										<span className="font-medium">
											환경 변수 (PATH) 설정
										</span>
										<div className="mt-1 ml-4 text-muted-foreground space-y-2">
											<p>
												<strong>방법 1: 시스템 설정 (권장)</strong>
											</p>
											<ol className="list-[lower-alpha] list-inside ml-4 space-y-1 text-xs">
												<li>
													Windows 키 + R → sysdm.cpl 입력 → Enter
												</li>
												<li>
													[고급] 탭 → [환경 변수] 버튼 클릭
												</li>
												<li>
													&ldquo;사용자 변수&rdquo; 또는 &ldquo;시스템 변수&rdquo;에서 Path 선택 →
													[편집]
												</li>
												<li>
													[새로 만들기] → C:\adb 입력 → [확인]
												</li>
												<li>
													모든 창을 닫고 새로운 명령 프롬프트(cmd)를
													엽니다
												</li>
											</ol>
											<p className="mt-2">
												<strong>방법 2: PowerShell (일시적)</strong>
											</p>
											<div className="bg-muted p-2 rounded text-xs font-mono">
												$env:Path += &ldquo;;C:\adb&rdquo;
											</div>
											<p className="text-xs text-muted-foreground mt-1">
												이 방법은 현재 세션에만 적용됩니다
											</p>
										</div>
									</li>
									<li className="pl-2">
										<span className="font-medium">ADB 설치 확인</span>
										<div className="mt-1 ml-4 text-muted-foreground space-y-1">
											<p>새로운 명령 프롬프트(cmd) 또는 PowerShell에서:</p>
											<div className="bg-muted p-2 rounded text-xs font-mono">
												adb version
											</div>
											<p className="text-xs">
												버전 정보가 출력되면 설치 완료입니다
											</p>
										</div>
									</li>
								</ol>
							</div>

							{/* macOS ADB Setup */}
							<div className="space-y-3">
								<h3 className="font-semibold text-base">
									2. ADB 설치 (macOS)
								</h3>
								<ol className="list-decimal list-inside space-y-3 text-sm">
									<li className="pl-2">
										<span className="font-medium">Homebrew로 설치</span>
										<div className="mt-1 ml-4 text-muted-foreground space-y-1">
											<p>터미널에서 다음 명령어를 실행합니다:</p>
											<div className="bg-muted p-2 rounded text-xs font-mono">
												brew install android-platform-tools
											</div>
											<p className="text-xs">
												Homebrew가 없다면{" "}
												<a
													href="https://brew.sh"
													target="_blank"
													rel="noopener noreferrer"
													className="text-primary hover:underline"
												>
													brew.sh
												</a>{" "}
												에서 먼저 설치하세요
											</p>
										</div>
									</li>
									<li className="pl-2">
										<span className="font-medium">ADB 설치 확인</span>
										<div className="mt-1 ml-4 text-muted-foreground">
											<div className="bg-muted p-2 rounded text-xs font-mono">
												adb version
											</div>
										</div>
									</li>
								</ol>
							</div>

							{/* Linux ADB Setup */}
							<div className="space-y-3">
								<h3 className="font-semibold text-base">
									3. ADB 설치 (Linux)
								</h3>
								<ol className="list-decimal list-inside space-y-2 text-sm">
									<li className="pl-2">
										<span className="font-medium">Ubuntu/Debian:</span>
										<div className="mt-1 ml-4 text-muted-foreground">
											<div className="bg-muted p-2 rounded text-xs font-mono">
												sudo apt update && sudo apt install android-tools-adb
											</div>
										</div>
									</li>
									<li className="pl-2">
										<span className="font-medium">Fedora:</span>
										<div className="mt-1 ml-4 text-muted-foreground">
											<div className="bg-muted p-2 rounded text-xs font-mono">
												sudo dnf install android-tools
											</div>
										</div>
									</li>
									<li className="pl-2">
										<span className="font-medium">Arch Linux:</span>
										<div className="mt-1 ml-4 text-muted-foreground">
											<div className="bg-muted p-2 rounded text-xs font-mono">
												sudo pacman -S android-tools
											</div>
										</div>
									</li>
								</ol>
							</div>

							<Separator className="my-4" />

							{/* Emulator ADB Setup */}
							<div className="space-y-3">
								<h3 className="font-semibold text-base">
									4. 에뮬레이터에서 ADB 디버깅 활성화
								</h3>

								{/* Android Studio Emulator */}
								<div className="bg-muted/50 p-4 rounded-lg space-y-2">
									<p className="font-medium text-sm">Android Studio 에뮬레이터</p>
									<p className="text-xs text-muted-foreground">
										Android Studio 에뮬레이터는 기본적으로 ADB가 활성화되어
										있습니다. 추가 설정이 필요하지 않습니다.
									</p>
								</div>

								{/* LDPlayer */}
								<div className="bg-muted/50 p-4 rounded-lg space-y-2">
									<p className="font-medium text-sm">LDPlayer</p>
									<ol className="list-decimal list-inside space-y-1 text-xs text-muted-foreground">
										<li>
											LDPlayer 설정 (키보드 아이콘 또는 Ctrl + 3) 열기
										</li>
										<li>[기타] 탭 선택</li>
										<li>
											&ldquo;Android 디버그 브리지(ADB) 활성화&rdquo; 체크
										</li>
										<li>에뮬레이터 재시작</li>
										<li>기본 포트: 5555 (LDPlayer 3/4), 5555 (LDPlayer 9)</li>
									</ol>
									<div className="mt-2 bg-background p-2 rounded text-xs font-mono">
										<p># 연결 확인:</p>
										<p>adb connect 127.0.0.1:5555</p>
									</div>
								</div>

								{/* NoxPlayer */}
								<div className="bg-muted/50 p-4 rounded-lg space-y-2">
									<p className="font-medium text-sm">NoxPlayer</p>
									<ol className="list-decimal list-inside space-y-1 text-xs text-muted-foreground">
										<li>
											NoxPlayer 설정 (톱니바퀴 아이콘 또는 Ctrl + 5) 열기
										</li>
										<li>[일반] 탭 선택</li>
										<li>&ldquo;개발자 옵션 활성화&rdquo; 체크</li>
										<li>에뮬레이터 재시작</li>
										<li>설정 다시 열기 → [일반] → &ldquo;USB 디버깅&rdquo; 활성화</li>
										<li>기본 포트: 62001</li>
									</ol>
									<div className="mt-2 bg-background p-2 rounded text-xs font-mono">
										<p># 연결 확인:</p>
										<p>adb connect 127.0.0.1:62001</p>
									</div>
								</div>

								{/* BlueStacks */}
								<div className="bg-muted/50 p-4 rounded-lg space-y-2">
									<p className="font-medium text-sm">BlueStacks 5</p>
									<ol className="list-decimal list-inside space-y-1 text-xs text-muted-foreground">
										<li>BlueStacks 설정 (톱니바퀴 아이콘) 열기</li>
										<li>[고대] 탭 선택</li>
										<li>&ldquo;Android Debug Bridge(ADB) 활성화&rdquo; 체크</li>
										<li>에뮬레이터 재시작</li>
										<li>기본 포트: 5555</li>
									</ol>
									<div className="mt-2 bg-background p-2 rounded text-xs font-mono">
										<p># 연결 확인:</p>
										<p>adb connect 127.0.0.1:5555</p>
									</div>
								</div>

								{/* MEmu Play */}
								<div className="bg-muted/50 p-4 rounded-lg space-y-2">
									<p className="font-medium text-sm">MEmu Play</p>
									<ol className="list-decimal list-inside space-y-1 text-xs text-muted-foreground">
										<li>
											MEmu 설정 (오른쪽 사이드바 톱니바퀴 아이콘) 열기
										</li>
										<li>[Android 설정] 탭 선택</li>
										<li>&ldquo;ADB 디버깅&rdquo; 활성화</li>
										<li>에뮬레이터 재시작</li>
										<li>기본 포트: 21503</li>
									</ol>
									<div className="mt-2 bg-background p-2 rounded text-xs font-mono">
										<p># 연결 확인:</p>
										<p>adb connect 127.0.0.1:21503</p>
									</div>
								</div>
							</div>

							{/* Verify ADB Connection */}
							<div className="space-y-3">
								<h3 className="font-semibold text-base">
									5. ADB 연결 확인
								</h3>
								<div className="bg-muted/50 p-4 rounded-lg space-y-2">
									<p className="text-sm">명령 프롬프트/터미널에서 다음을 실행:</p>
									<div className="bg-background p-2 rounded text-xs font-mono space-y-1">
										<p># 에뮬레이터 연결 (필요한 경우):</p>
										<p>adb connect 127.0.0.1:5555</p>
										<p className="mt-2"># 연결된 장치 확인:</p>
										<p>adb devices</p>
									</div>
									<p className="text-xs text-muted-foreground">
										&ldquo;List of devices attached&rdquo; 아래에 장치가 표시되면 연결이
										성공한 것입니다.
									</p>
								</div>
							</div>
						</CardContent>
					</Card>

					{/* Monitoring Client Setup */}
					<Card className="border-2">
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Download className="h-5 w-5" />
								모니터링 클라이언트 설치 및 실행
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="space-y-3 text-sm">
								<div className="flex gap-3">
									<div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
										1
									</div>
									<div>
										<p className="font-medium">
											모니터링 클라이언트 다운로드
										</p>
										<p className="text-muted-foreground text-xs mt-1">
											<a
												href="https://github.com/shanefully-done/mapleting/releases"
												target="_blank"
												rel="noopener noreferrer"
												className="text-primary hover:underline"
											>
												GitHub 릴리즈 페이지
											</a>{" "}
											에서 운영체제에 맞는 클라이언트 프로그램을
											다운로드하세요.
										</p>
									</div>
								</div>
								<div className="flex gap-3">
									<div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
										2
									</div>
									<div>
										<p className="font-medium">config.json 설정</p>
										<p className="text-muted-foreground text-xs mt-1">
											다운로드한 폴더에 있는 config.json 파일을 메모장으로
											엽니다:
										</p>
										<div className="mt-2 bg-muted p-3 rounded text-xs font-mono">
											<span className="text-muted-foreground"># &ldquo;server_url&rdquo;:</span> &ldquo;서버URL&rdquo;,
											<br />
											<span className="text-muted-foreground"># &ldquo;nickname&rdquo;:</span> &ldquo;캐릭터닉네임&rdquo;,
											<br />
											<span className="text-muted-foreground"># &ldquo;secret&rdquo;:</span> &ldquo;서버에서받은시크릿키&rdquo;,
											<br />
											<span className="text-muted-foreground"># &ldquo;package_name&rdquo;:</span> &ldquo;com.nexon.ma&rdquo;,
											<br />
											<span className="text-muted-foreground"># &ldquo;check_interval_seconds&rdquo;:</span> 3
										</div>
										<div className="mt-2 space-y-1 text-xs text-muted-foreground">
											<p>
												• <code className="bg-muted px-1 rounded">nickname</code>:
												모니터링할 캐릭터 닉네임
											</p>
											<p>
												• <code className="bg-muted px-1 rounded">secret</code>:
												서버에서 발급받은 시크릿 키 (초기 설정 시 필요)
											</p>
											<p>
												• <code className="bg-muted px-1 rounded">package_name</code>:
												메이플스토리 패키지명 (기본값: com.nexon.ma)
											</p>
											<p>
												• <code className="bg-muted px-1 rounded">check_interval_seconds</code>:
												상태 확인 간격 (초, 기본값: 3)
											</p>
										</div>
									</div>
								</div>
								<div className="flex gap-3">
									<div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
										3
									</div>
									<div>
										<p className="font-medium">클라이언트 실행</p>
										<p className="text-muted-foreground text-xs mt-1">
											터미널/명령 프롬프트에서 클라이언트 파일이 있는
											폴더로 이동 후:
										</p>
										<div className="mt-2 bg-muted p-2 rounded text-xs font-mono">
											# Windows:
											<br />
											monitor.exe
											<br />
											<br />
											# macOS/Linux:
											<br />
											chmod +x monitor
											<br />
											./monitor
										</div>
										<p className="text-xs text-muted-foreground mt-1">
											클라이언트가 게임 상태를 감시하기 시작합니다.
										</p>
									</div>
								</div>
							</div>
						</CardContent>
					</Card>

					{/* Subscription Instructions */}
					<Card className="border-2">
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<BookOpen className="h-5 w-5" />
								푸시 알림 구독 방법
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<ol className="list-decimal list-inside space-y-3 text-sm">
								<li className="pl-2">
									<strong>홈페이지로 이동</strong> - 상단의 &ldquo;홈으로&rdquo; 버튼을
									클릭하거나{" "}
									<Link href="/" className="text-primary hover:underline">
										여기
									</Link>{" "}
									를 클릭하세요
								</li>
								<li className="pl-2">
									<strong>캐릭터 닉네임 입력</strong> - 입력창에 캐릭터 닉네임을
									입력하고 &ldquo;조회&rdquo; 버튼을 클릭하세요
								</li>
								<li className="pl-2">
									<strong>알림 활성화</strong> - 브라우저에서 푸시 알림을 허용하세요
								</li>
								<li className="pl-2">
									<strong>앱으로 설치</strong> - 모바일은 홈 화면에 추가하여
									앱처럼 사용하세요 (PWA)
								</li>
								<li className="pl-2">
									<strong>알림 수신</strong> - 디바이스가 오프라인되면 즉시 알림을
									받습니다
								</li>
							</ol>
							<div className="pt-2 border-t">
								<p className="text-xs text-muted-foreground">
									<strong>💡 참고</strong> 모바일에서는 앱으로 설치해야 브라우저가
									꺼져 있거나 백그라운드 상태에서도 알림을 받을 수 있습니다.
								</p>
							</div>
						</CardContent>
					</Card>

					{/* Support Card */}
					<Card className="bg-muted/50">
						<CardHeader>
							<CardTitle className="text-base">문제 해결</CardTitle>
						</CardHeader>
						<CardContent className="space-y-2 text-sm text-muted-foreground">
							<p>
								<strong>ADB 연결이 안 될 때:</strong> 에뮬레이터에서 ADB
								디버깅이 활성화되어 있는지 확인하고, 에뮬레이터를 재시작해 보세요.
							</p>
							<p>
								<strong>알림이 안 올 때:</strong> 브라우저의 알림 권한을 확인하고,
								모바일에서는 앱으로 설치되어 있는지 확인하세요.
							</p>
							<p>
								<strong>추가 도움:</strong>{" "}
								<a
									href="https://github.com/shanefully-done/mapleting/issues"
									target="_blank"
									rel="noopener noreferrer"
									className="text-primary hover:underline"
								>
									GitHub Issues
								</a>{" "}
								에서 질문하거나 버그를 신고해 주세요.
							</p>
						</CardContent>
					</Card>
				</div>
			</main>

			{/* Footer */}
			<footer className="border-t mt-12">
				<div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
					<p>MapleTing - 크로스 플랫폼 디바이스 모니터링 시스템</p>
				</div>
			</footer>
		</div>
	);
}

function Separator({ className }: { className?: string }) {
	return (
		<div className={`border-t ${className}`} />
	);
}
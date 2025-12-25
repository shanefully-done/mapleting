import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
	ArrowLeft,
	BookOpen,
	Download,
	Smartphone,
	AlertCircle,
	CheckCircle2,
} from "lucide-react";
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
						<h1 className="text-3xl font-bold tracking-tight">설정 가이드</h1>
						<p className="text-muted-foreground">안드로이드 앱 설치 및 설정 방법</p>
					</div>

					{/* Quick Overview */}
					<Card className="border-primary/20 bg-primary/5">
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Smartphone className="h-5 w-5" />
								메이플팅이란?
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-2 text-sm">
							<p>
								메이플팅은 안드로이드 앱을 통해 기기에서 메이플스토리가 완전히 팅긴 경우
								웹 푸시 알림을 받을 수 있는 서비스입니다.
							</p>
							<p className="text-muted-foreground">
								<strong>💡 특별한 설정이 필요 없습니다!</strong> ADB나 복잡한 프로그램
								설치 없이, 앱만 설치하면 바로 모니터링을 시작할 수 있습니다. 기기에서
								직접 게임 상태를 확인하므로 더 정확하고 신뢰성이 높습니다.
							</p>
						</CardContent>
					</Card>

					{/* System Requirements */}
					<Card className="border-2">
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<CheckCircle2 className="h-5 w-5 text-green-600" />
								시스템 요구사항
							</CardTitle>
							<CardDescription>앱을 설치하기 전에 확인해주세요</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4 text-sm">
							<div className="space-y-2">
								<p className="font-medium">지원 기기</p>
								<ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
									<li>안드로이드 7.0 (누가) 이상</li>
									<li>삼성, LG, 샤오미, 화웨이 등 모든 안드로이드 기기</li>
									<li>에뮬레이터 (LDPlayer, Nox, BlueStacks 등)</li>
								</ul>
							</div>
							<div className="space-y-2">
								<p className="font-medium">필수 권한</p>
								<ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
									<li>접근성 권한 (앱 상태 감지)</li>
									<li>배터리 최적화 해제 (백그라운드 실행)</li>
									<li>알림 권한 (모니터링 상태 표시)</li>
								</ul>
							</div>
						</CardContent>
					</Card>

					{/* Step 1: Download APK */}
					<Card className="border-2">
						<CardHeader className="bg-primary/5">
							<CardTitle className="flex items-center gap-2">
								<div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
									1
								</div>
								APK 다운로드
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4 pt-6">
							<div className="space-y-3 text-sm">
								<p className="font-medium">GitHub 릴리즈 페이지에서 다운로드</p>
								<ol className="list-decimal list-inside space-y-2 text-muted-foreground ml-2">
									<li>아래 버튼을 클릭하여 GitHub 릴리즈 페이지로 이동하세요</li>
									<li>최신 릴리즈를 찾습니다 (보통 상단에 있습니다)</li>
									<li>
										<strong>Assets</strong> 섹션에서{" "}
										<code className="bg-muted px-1 rounded">app-release.apk</code> 또는
										유사한 이름의 APK 파일을 찾습니다
									</li>
									<li>APK 파일을 클릭하여 다운로드합니다</li>
								</ol>

								<div className="pt-4">
									<Button asChild size="lg" className="w-full sm:w-auto gap-2">
										<a
											href="https://github.com/shanefully-done/mapleting/releases"
											target="_blank"
											rel="noopener noreferrer"
										>
											<Download className="h-4 w-4" />
											GitHub 릴리즈 페이지 열기
										</a>
									</Button>
								</div>

								<Alert>
									<AlertCircle className="h-4 w-4" />
									<AlertTitle>다운로드가 안 될 때</AlertTitle>
									<AlertDescription className="text-xs">
										일부 브라우저에서 APK 다운로드가 차단될 수 있습니다. 다운로드가
										시작되지 않으면:
										<ul className="list-disc list-inside mt-1 space-y-1">
											<li>Chrome: 주소창 왼쪽의 다운로드 차단 아이콘을 클릭하여 허용</li>
											<li>Safari: 다운로드 목록에서 차단된 항목 확인</li>
											<li>파이어폭스: 상단 표시줄의 차단 알림 확인</li>
										</ul>
									</AlertDescription>
								</Alert>
							</div>
						</CardContent>
					</Card>

					{/* Step 2: Installation */}
					<Card className="border-2">
						<CardHeader className="bg-primary/5">
							<CardTitle className="flex items-center gap-2">
								<div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
									2
								</div>
								앱 설치
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4 pt-6">
							<div className="space-y-4 text-sm">
								<div className="space-y-2">
									<p className="font-medium">실제 기기에 설치</p>
									<ol className="list-decimal list-inside space-y-2 text-muted-foreground ml-2">
										<li>
											다운로드한 APK 파일을 찾습니다 (보통{" "}
											<code className="bg-muted px-1 rounded">다운로드</code> 폴더)
										</li>
										<li>APK 파일을 탭하여 설치를 시작합니다</li>
										<li>
											<strong>알 수 없는 출처 앱 설치</strong> 권한을 허용합니다
											<div className="bg-muted p-2 rounded text-xs mt-1">
												설정 → 보안 → 알 수 없는 출처 (허용)
											</div>
										</li>
										<li>
											설치가 완료되면 <strong>열기</strong> 또는 <strong>완료</strong>를
											탭합니다
										</li>
									</ol>
								</div>

								<div className="space-y-2">
									<p className="font-medium">에뮬레이터에 설치</p>
									<div className="space-y-3">
										<div className="bg-muted/50 p-3 rounded-lg">
											<p className="font-medium text-xs">LDPlayer</p>
											<ol className="list-decimal list-inside space-y-1 text-xs text-muted-foreground mt-2">
												<li>APK 파일을 LDPlayer 창으로 드래그 앤 드롭</li>
												<li>또는 APK 파일을 더블 클릭</li>
											</ol>
										</div>
										<div className="bg-muted/50 p-3 rounded-lg">
											<p className="font-medium text-xs">NoxPlayer</p>
											<ol className="list-decimal list-inside space-y-1 text-xs text-muted-foreground mt-2">
												<li>APK 파일을 NoxPlayer 창으로 드래그 앤 드롭</li>
												<li>또는 우클릭 → APK에서 열기</li>
											</ol>
										</div>
										<div className="bg-muted/50 p-3 rounded-lg">
											<p className="font-medium text-xs">BlueStacks</p>
											<ol className="list-decimal list-inside space-y-1 text-xs text-muted-foreground mt-2">
												<li>APK 파일을 BlueStacks 창으로 드래그 앤 드롭</li>
												<li>또는 설치 APK 버튼 클릭</li>
											</ol>
										</div>
									</div>
								</div>
							</div>
						</CardContent>
					</Card>

					{/* Step 3: Permissions */}
					<Card className="border-2">
						<CardHeader className="bg-primary/5">
							<CardTitle className="flex items-center gap-2">
								<div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
									3
								</div>
								권한 설정
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4 pt-6">
							<div className="space-y-4 text-sm">
								<div className="space-y-2">
									<p className="font-medium">접근성 권한 (필수)</p>
									<ol className="list-decimal list-inside space-y-2 text-muted-foreground ml-2">
										<li>앱에서 &ldquo;접근성 설정 열기&rdquo; 버튼을 탭합니다</li>
										<li>
											<strong>Mapleting Monitor</strong>를 찾아 ON으로 켭니다
										</li>
										<li>
											팝업이 나오면 <strong>허용</strong>을 탭합니다
										</li>
										<li>앱으로 돌아와서 권한이 부여되었는지 확인합니다</li>
									</ol>
									<Alert>
										<AlertCircle className="h-4 w-4" />
										<AlertTitle>접근성 권한이 필요한 이유</AlertTitle>
										<AlertDescription className="text-xs">
											앱이 화면에 표시된 내용을 분석하여 특정 앱이 실행 중인지 확인하기
											위해 필요합니다. 개인정보는 수집하지 않으며 앱 상태 감지 목적으로만
											사용됩니다.
										</AlertDescription>
									</Alert>
								</div>

								<div className="space-y-2">
									<p className="font-medium">배터리 최적화 해제 (중요)</p>
									<ol className="list-decimal list-inside space-y-2 text-muted-foreground ml-2">
										<li>앱에서 &ldquo;배터리 최적화 설정&rdquo; 버튼을 탭합니다</li>
										<li>
											<strong>제한 없음</strong> 또는 <strong>최적화 안 함</strong>을
											선택합니다
										</li>
										<li>앱으로 돌아와서 설정이 적용되었는지 확인합니다</li>
									</ol>
									<Alert>
										<AlertCircle className="h-4 w-4" />
										<AlertTitle>왜 배터리 최적화를 해제해야 하나요?</AlertTitle>
										<AlertDescription className="text-xs">
											안드로이드 시스템은 배터리를 절약하기 위해 백그라운드 앱을 자동으로
											종료합니다. 모니터링 앱이 계속 실행되도록 하려면 배터리 최적화를
											해제해야 합니다. 배터리 소모는 매우 적습니다.
										</AlertDescription>
									</Alert>
								</div>

								<div className="space-y-2">
									<p className="font-medium">알림 권한</p>
									<p className="text-muted-foreground ml-2">
										앱이 모니터링 상태를 표시하기 위해 알림 권한이 필요합니다. 첫 실행 시
										알림 권한을 허용해 주세요.
									</p>
								</div>
							</div>
						</CardContent>
					</Card>

					{/* Step 4: Configuration */}
					<Card className="border-2">
						<CardHeader className="bg-primary/5">
							<CardTitle className="flex items-center gap-2">
								<div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
									4
								</div>
								설정
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4 pt-6">
							<div className="space-y-4 text-sm">
								<div className="space-y-3">
									<strong>닉네임 설정</strong>
									<div className="ml-4 mt-1 space-y-1">
										<p>
											• 앱을 실행하고 &ldquo;닉네임&rdquo; 필드에 캐릭터명을 입력합니다
										</p>
										<p>
											• 예: <code className="bg-muted px-1 rounded">테스트캐릭터01</code>
										</p>
										<p className="text-xs">※ 한글, 영문, 숫자, 일부 특수문자 사용 가능</p>
									</div>
								</div>
							</div>
						</CardContent>
					</Card>

					{/* Step 5: Start Monitoring */}
					<Card className="border-2">
						<CardHeader className="bg-primary/5">
							<CardTitle className="flex items-center gap-2">
								<div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
									5
								</div>
								모니터링 시작
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4 pt-6">
							<div className="space-y-4 text-sm">
								<div className="space-y-3">
									<p className="font-medium">모니터링 시작 방법</p>
									<ol className="list-decimal list-inside space-y-2 text-muted-foreground ml-2">
										<li>
											모든 설정이 완료되면 <strong>&ldquo;모니터링 시작&rdquo;</strong>{" "}
											버튼을 탭합니다
										</li>
										<li>
											상태 표시가 <strong className="text-green-600">● 모니터링 중</strong>
											으로 변경되면 성공입니다
										</li>
										<li>알림창이 계속 표시되며 모니터링 상태를 보여줍니다</li>
										<li>이제 앱을 백그라운드로 전환해도 모니터링이 계속됩니다</li>
									</ol>
								</div>

								<div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
									<p className="font-medium text-green-700 dark:text-green-400 mb-2">
										✅ 모니터링이 정상 작동하는지 확인하세요
									</p>
									<ul className="space-y-1 text-xs text-muted-foreground">
										<li>• 알림창이 계속 표시되어야 합니다</li>
										<li>
											• 알림창에 &ldquo;마지막 하트비트: 방금 전&rdquo;이 표시되어야 합니다
										</li>
										<li>• 홈 화면에 상태 표시줄이 보여야 합니다</li>
									</ul>
								</div>

								<div className="space-y-2">
									<p className="font-medium">모니터링 중지</p>
									<p className="text-muted-foreground ml-2">
										모니터링을 중지하려면 앱을 열고{" "}
										<strong>&ldquo;모니터링 중지&rdquo;</strong> 버튼을 탭합니다. 알림창이
										사라지고 상태가 &ldquo;중지됨&rdquo;으로 변경됩니다.
									</p>
								</div>
							</div>
						</CardContent>
					</Card>

					{/* Troubleshooting */}
					<Card className="border-2 bg-muted/30">
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<AlertCircle className="h-5 w-5" />
								문제 해결
							</CardTitle>
							<CardDescription>자주 발생하는 문제와 해결 방법</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4 text-sm">
							<div className="space-y-3">
								<div className="space-y-1">
									<p className="font-medium">❌ 접근성 권한이 자동으로 꺼짐</p>
									<p className="text-muted-foreground text-xs ml-2">
										일부 기기(특히 샤오미, 화웨이)는 시스템 설정에서 접근성 권한을
										자동으로 끌 수 있습니다. 설정 → 접근성 → Mapleting Monitor가 켜져
										있는지 자주 확인하세요.
									</p>
								</div>

								<div className="space-y-1">
									<p className="font-medium">❌ 모니터링이 자동으로 중지됨</p>
									<p className="text-muted-foreground text-xs ml-2">
										배터리 최적화가 제대로 해제되지 않았을 수 있습니다. 설정 → 배터리 →
										배터리 최적화에서 Mapleting Monitor가 &ldquo;최적화 안 함&rdquo;으로
										되어 있는지 확인하세요.
									</p>
								</div>

								<div className="space-y-1">
									<p className="font-medium">❌ 하트비트가 전송되지 않음</p>
									<p className="text-muted-foreground text-xs ml-2">
										인터넷 연결을 확인하세요. Wi-Fi가 불안정하면 모바일 데이터를 사용해
										보세요. 또한 시크릿 키가 올바른지 확인하세요.
									</p>
								</div>

								<div className="space-y-1">
									<p className="font-medium">❌ 알림이 오지 않음</p>
									<p className="text-muted-foreground text-xs ml-2">
										웹사이트에서 푸시 알림을 구독했는지 확인하세요. 홈페이지로 이동하여
										닉네임으로 조회한 후 알림을 활성화하세요.
									</p>
								</div>

								<div className="space-y-1">
									<p className="font-medium">❌ APK 설치가 안 됨</p>
									<p className="text-muted-foreground text-xs ml-2">
										설정 → 보안에서 &ldquo;알 수 없는 출처&rdquo;를 허용했는지 확인하세요.
										일부 제조사(삼성 등)는 추가 설정이 필요할 수 있습니다.
									</p>
								</div>

								<div className="space-y-1">
									<p className="font-medium">❌ 앱이 강제 종료됨</p>
									<p className="text-muted-foreground text-xs ml-2">
										설정 → 애플리케이션 → Mapleting Monitor → 배터리에서 &ldquo;배터리
										사용 제한&rdquo;을 끄세요.
									</p>
								</div>
							</div>

							<Alert>
								<BookOpen className="h-4 w-4" />
								<AlertTitle>추가 도움이 필요하신가요?</AlertTitle>
								<AlertDescription className="text-xs">
									해결되지 않는 문제가 있으면{" "}
									<a
										href="https://github.com/shanefully-done/mapleting/issues"
										target="_blank"
										rel="noopener noreferrer"
										className="text-primary hover:underline font-medium"
									>
										GitHub Issues
									</a>{" "}
									에서 질문하거나 버그를 신고해 주세요. 기기 정보와 안드로이드 버전을
									함께 알려주시면 더 빨리 도와드릴 수 있습니다.
								</AlertDescription>
							</Alert>
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
									<strong>캐릭터 닉네임 입력</strong> - 입력창에 캐릭터 닉네임을 입력하고
									&ldquo;조회&rdquo; 버튼을 클릭하세요
								</li>
								<li className="pl-2">
									<strong>알림 활성화</strong> - 브라우저에서 푸시 알림을 허용하세요
								</li>
								<li className="pl-2">
									<strong>앱으로 설치</strong> - 모바일은 홈 화면에 추가하여 앱처럼
									사용하세요 (PWA)
								</li>
								<li className="pl-2">
									<strong>알림 수신</strong> - 디바이스가 오프라인되면 즉시 알림을
									받습니다
								</li>
							</ol>
							<div className="pt-2 border-t">
								<p className="text-xs text-muted-foreground">
									<strong>💡 참고</strong> 일부 모바일 기기에서는 웹앱으로 설치해야
									브라우저가 꺼져 있거나 백그라운드 상태에서도 알림을 받을 수 있습니다.
								</p>
							</div>
						</CardContent>
					</Card>
				</div>
			</main>

			{/* Footer */}
			<footer className="border-t mt-12">
				<div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
					<p>MapleTing - 크로스 플랫폼 디바이스 모니터링 시스템</p>
					<p className="text-xs mt-1">
						안드로이드 앱으로 더 간편하게 모니터링하세요
					</p>
				</div>
			</footer>
		</div>
	);
}

import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "메이플팅",
	description: "에뮬레이터 메이플 키우기 팅기면 알랴드림",
	manifest: "/manifest.json",
	appleWebApp: {
		capable: true,
		statusBarStyle: "default",
		title: "메이플팅",
	},
};

export const viewport: Viewport = {
	width: "device-width",
	initialScale: 1,
	maximumScale: 1,
	userScalable: false,
	themeColor: "#000000",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<head>
				<link rel="icon" href="/icons/icon-192x192.svg" />
				<link rel="apple-touch-icon" href="/icons/icon-192x192.svg" />
			</head>
			<body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
				<script
					dangerouslySetInnerHTML={{
						__html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(
                    function(registration) {
                      console.log('Service Worker registered with scope:', registration.scope);
                    },
                    function(err) {
                      console.log('Service Worker registration failed:', err);
                    }
                  );
                });
              }
            `,
					}}
				/>
				{children}
			</body>
		</html>
	);
}

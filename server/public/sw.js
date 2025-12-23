// Service Worker for MapleTing Monitor PWA
// Handles push notifications and notification clicks

// Base64-URL encoding/decoding utilities for nickname handling
function base64UrlEncode(uint8Array) {
	let binary = "";
	uint8Array.forEach((byte) => {
		binary += String.fromCharCode(byte);
	});
	return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

function base64UrlDecode(base64Url) {
	const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
	const padded = base64.padEnd(
		base64.length + ((4 - (base64.length % 4)) % 4),
		"="
	);
	const binary = atob(padded);
	const uint8Array = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) {
		uint8Array[i] = binary.charCodeAt(i);
	}
	return uint8Array;
}

// Install event - skip waiting to activate immediately
self.addEventListener("install", (event) => {
	console.log("[Service Worker] Install event triggered");
	event.waitUntil(self.skipWaiting());
});

// Activate event - claim all clients immediately
self.addEventListener("activate", (event) => {
	console.log("[Service Worker] Activate event triggered");
	event.waitUntil(
		self.clients.claim().then(() => {
			console.log("[Service Worker] Claimed all clients");
		})
	);
});

// Push event - receive and display push notifications
self.addEventListener("push", (event) => {
	console.log("[Service Worker] Push event received");

	if (!event.data) {
		console.warn("[Service Worker] Push event with no data");
		return;
	}

	try {
		const payload = event.data.json();
		console.log("[Service Worker] Push payload:", payload);

		const options = {
			body: payload.body || "",
			icon: "/icons/icon-192x192.svg",
			badge: "/icons/icon-72x72.svg",
			vibrate: [200, 100, 200],
			data: {
				nicknameEncoded: payload.data?.nicknameEncoded || null,
				timestamp: payload.timestamp || Date.now(),
				status: payload.status || null,
			},
			requireInteraction: true,
			silent: false,
		};

		// Add actions if supported
		if (payload.actions) {
			options.actions = payload.actions;
		}

		event.waitUntil(
			self.registration.showNotification(
				payload.title || "MapleTing Monitor",
				options
			)
		);
	} catch (error) {
		console.error("[Service Worker] Error parsing push payload:", error);
		// Fallback: show basic notification
		event.waitUntil(
			self.registration.showNotification("MapleTing Monitor", {
				body: "You have a new notification",
				icon: "/icons/icon-192x192.svg",
				badge: "/icons/icon-72x72.svg",
			})
		);
	}
});

// Notification click event - handle user interaction with notifications
self.addEventListener("notificationclick", (event) => {
	console.log("[Service Worker] Notification click event");

	event.notification.close();

	const nicknameEncoded = event.notification.data?.nicknameEncoded;

	// Determine URL to open
	let url = "/";
	if (nicknameEncoded) {
		url = `/n/${encodeURIComponent(nicknameEncoded)}`;
	}

	event.waitUntil(
		self.clients
			.matchAll({
				type: "window",
				includeUncontrolled: true,
			})
			.then((clientList) => {
				// Try to find and focus an existing window
				for (const client of clientList) {
					if (
						client.url.includes(new URL(url, self.location.origin).pathname) &&
						"focus" in client
					) {
						return client.focus();
					}
				}
				// If no matching window, open a new one
				if (self.clients.openWindow) {
					return self.clients.openWindow(url);
				}
			})
			.catch((error) => {
				console.error("[Service Worker] Error handling notification click:", error);
				// Fallback: try to open window without checking existing clients
				if (self.clients.openWindow) {
					return self.clients.openWindow(url);
				}
			})
	);
});

// Handle notification close (optional - for analytics)
self.addEventListener("notificationclose", (event) => {
	console.log("[Service Worker] Notification closed", event.notification.data);
});

// Sync event for background sync (future use)
self.addEventListener("sync", (event) => {
	console.log("[Service Worker] Sync event:", event.tag);
	// Future: handle background sync tasks
});

// Message event for communication from clients
self.addEventListener("message", (event) => {
	console.log("[Service Worker] Message received from client:", event.data);

	// Handle different message types
	if (event.data && event.data.type === "SKIP_WAITING") {
		self.skipWaiting();
	}
});

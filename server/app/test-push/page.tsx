'use client';

import { useState, useEffect } from 'react';

export default function TestPushPage() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [swRegistered, setSwRegistered] = useState(false);
  const [pushSupported, setPushSupported] = useState(false);
  const [vapidKey, setVapidKey] = useState<string>('');
  const [logs, setLogs] = useState<string[]>([]);
  const [pushSubscription, setPushSubscription] = useState<PushSubscription | null>(null);

  const addLog = (message: string) => {
    const timestamp = new Date().toISOString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
    console.log(`[TestPush] ${message}`);
  };

  useEffect(() => {
    addLog('Page loaded');
    
    // Check push support
    const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
    setPushSupported(supported);
    addLog(`Push supported: ${supported}`);
    
    // Check permission
    setPermission(Notification.permission);
    addLog(`Notification permission: ${Notification.permission}`);
    
    // Check service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then(reg => {
        if (reg) {
          setSwRegistered(true);
          addLog(`Service Worker registered: ${reg.scope}`);
          
          // Check for existing push subscription
          reg.pushManager.getSubscription().then(sub => {
            if (sub) {
              setPushSubscription(sub);
              addLog('Existing push subscription found');
              addLog(`Endpoint: ${sub.endpoint.substring(0, 50)}...`);
            } else {
              addLog('No existing push subscription');
            }
          });
        } else {
          addLog('No service worker registration found');
        }
      });
    }
    
    // Check VAPID key availability
    // In Next.js, NEXT_PUBLIC_ vars are available at build time
    const vapid = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
    setVapidKey(vapid);
    addLog(`VAPID key configured: ${!!vapid}`);
    if (vapid) {
      addLog(`VAPID key (prefix): ${vapid.substring(0, 20)}...`);
    }
  }, []);

  const requestPermission = async () => {
    addLog('Requesting notification permission...');
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      addLog(`Permission granted: ${result === 'granted'}`);
    } catch (error) {
      addLog(`Error requesting permission: ${error}`);
    }
  };

  const registerServiceWorker = async () => {
    addLog('Registering service worker...');
    try {
      const reg = await navigator.serviceWorker.register('/sw.js');
      setSwRegistered(true);
      addLog(`Service Worker registered successfully: ${reg.scope}`);
    } catch (error) {
      addLog(`Error registering service worker: ${error}`);
    }
  };

  const subscribeToPush = async () => {
    addLog('Attempting to subscribe to push...');
    
    try {
      const reg = await navigator.serviceWorker.ready;
      addLog('Service worker ready');
      
      if (!vapidKey) {
        addLog('ERROR: VAPID key not available!');
        return;
      }
      
      addLog(`VAPID key length: ${vapidKey.length}`);
      
      // Convert VAPID key
      const padding = '='.repeat((4 - (vapidKey.length % 4)) % 4);
      const base64 = (vapidKey + padding).replace(/-/g, '+').replace(/_/g, '/');
      const rawData = window.atob(base64);
      const outputArray = new Uint8Array(rawData.length);
      for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
      }
      addLog(`VAPID key converted to Uint8Array (${outputArray.length} bytes)`);
      
      // Subscribe
      addLog('Calling pushManager.subscribe()...');
      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: outputArray,
      });
      
      setPushSubscription(subscription);
      addLog('✓ Push subscription successful!');
      addLog(`Endpoint: ${subscription.endpoint.substring(0, 50)}...`);
      addLog(`Keys present: ${subscription.getKey('p256dh') ? 'yes' : 'no'} (p256dh), ${subscription.getKey('auth') ? 'yes' : 'no'} (auth)`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      addLog(`✗ Push subscription failed: ${errorMessage}`);
      addLog(`Error details: ${JSON.stringify(error)}`);
    }
  };

  const clearLogs = () => setLogs([]);

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto', fontFamily: 'monospace' }}>
      <h1>Push Notification Debug Tool</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <h2>Status</h2>
        <ul>
          <li>Push Supported: <strong>{pushSupported ? '✓ Yes' : '✗ No'}</strong></li>
          <li>Service Worker Registered: <strong>{swRegistered ? '✓ Yes' : '✗ No'}</strong></li>
          <li>Notification Permission: <strong>{permission}</strong></li>
          <li>VAPID Key Configured: <strong>{vapidKey ? '✓ Yes' : '✗ No'}</strong></li>
          <li>Push Subscribed: <strong>{pushSubscription ? '✓ Yes' : '✗ No'}</strong></li>
        </ul>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h2>Actions</h2>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button 
            onClick={requestPermission}
            disabled={permission === 'granted'}
            style={{ padding: '8px 16px', cursor: 'pointer' }}
          >
            Request Permission
          </button>
          <button 
            onClick={registerServiceWorker}
            disabled={swRegistered}
            style={{ padding: '8px 16px', cursor: 'pointer' }}
          >
            Register SW
          </button>
          <button 
            onClick={subscribeToPush}
            disabled={!swRegistered || permission !== 'granted' || !vapidKey}
            style={{ padding: '8px 16px', cursor: 'pointer' }}
          >
            Subscribe to Push
          </button>
          <button 
            onClick={clearLogs}
            style={{ padding: '8px 16px', cursor: 'pointer' }}
          >
            Clear Logs
          </button>
        </div>
      </div>

      <div>
        <h2>Logs</h2>
        <div style={{ 
          background: '#f5f5f5', 
          padding: '10px', 
          borderRadius: '4px',
          height: '400px',
          overflowY: 'auto',
          fontSize: '12px'
        }}>
          {logs.length === 0 ? (
            <em>No logs yet. Perform an action to see logs here.</em>
          ) : (
            logs.map((log, i) => (
              <div key={i} style={{ marginBottom: '4px', borderBottom: '1px solid #ddd', paddingBottom: '4px' }}>
                {log}
              </div>
            ))
          )}
        </div>
      </div>

      {pushSubscription && (
        <div style={{ marginTop: '20px', padding: '10px', background: '#e8f5e9', borderRadius: '4px' }}>
          <h3>✓ Push Subscription Successful!</h3>
          <p><strong>Endpoint:</strong> {pushSubscription.endpoint.substring(0, 80)}...</p>
          <p><strong>Keys:</strong></p>
          <ul>
            <li>p256dh: {pushSubscription.getKey('p256dh') ? `${Array.from(new Uint8Array(pushSubscription.getKey('p256dh')!)).slice(0, 20).join(', ')}...` : 'N/A'}</li>
            <li>auth: {pushSubscription.getKey('auth') ? `${Array.from(new Uint8Array(pushSubscription.getKey('auth')!)).slice(0, 10).join(', ')}...` : 'N/A'}</li>
          </ul>
        </div>
      )}
    </div>
  );
}
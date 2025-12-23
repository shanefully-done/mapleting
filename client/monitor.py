import subprocess
import time
import json
import sys
import urllib.request
import urllib.parse
import shutil

CONFIG_FILE = "config.json"

def load_config():
    try:
        with open(CONFIG_FILE, "r", encoding="utf-8") as f:
            config = json.load(f)
    except FileNotFoundError:
        print(f"Error: {CONFIG_FILE} not found")
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(f"Error: Invalid JSON in {CONFIG_FILE}: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"Failed to load config.json: {e}")
        sys.exit(1)
    
    # Validate required fields
    required_keys = ["server_url", "nickname", "package_name"]
    missing_keys = [key for key in required_keys if key not in config]
    if missing_keys:
        print(f"Error: Missing required config keys: {', '.join(missing_keys)}")
        sys.exit(1)
    
    return config

def adb_exists():
    return shutil.which("adb") is not None

def is_app_running(package):
    try:
        result = subprocess.run(
            ["adb", "shell", "ps"],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        return package in result.stdout
    except Exception:
        return False

def send_heartbeat(server_url, nickname, status, timestamp_ms):
    """
    Send heartbeat to Next.js server.
    
    Args:
        server_url: Base URL of the server (e.g., "http://localhost:3000")
        nickname: Display name for this device (UTF-8)
        status: Either "connected" or "disconnected"
        timestamp_ms: Unix timestamp in milliseconds
    
    Returns:
        True if heartbeat was sent successfully, False otherwise
    """
    if not server_url:
        print("Error: server_url is missing")
        return False
    
    # Prepare heartbeat payload
    payload = {
        "nickname": nickname,
        "status": status,
        "timestamp": timestamp_ms
    }
    
    # Encode payload as JSON
    data = json.dumps(payload).encode("utf-8")
    
    # Construct full URL
    url = f"{server_url.rstrip('/')}/api/heartbeat"
    
    # Prepare request with headers
    headers = {
        "Content-Type": "application/json"
    }
    
    req = urllib.request.Request(url, data=data, headers=headers, method="POST")
    
    # Retry with exponential backoff
    max_retries = 5
    base_delay = 1  # seconds
    
    for attempt in range(max_retries):
        try:
            response = urllib.request.urlopen(req, timeout=10)
            
            # Check response status
            if response.status == 200:
                return True
            else:
                print(f"Server returned status {response.status}")
                return False
                
        except urllib.error.HTTPError as e:
            # Handle HTTP errors (4xx, 5xx)
            if e.code == 429:
                print("Note: Rate limited - too many requests")
                return False
            elif e.code >= 500:
                # Server error - retry with backoff
                if attempt < max_retries - 1:
                    delay = min(base_delay * (2 ** attempt), 30)
                    print(f"Server error {e.code}, retrying in {delay}s... (attempt {attempt + 1}/{max_retries})")
                    time.sleep(delay)
                    continue
                else:
                    print(f"Server error {e.code}: {e.reason}")
                    return False
            else:
                print(f"HTTP error {e.code}: {e.reason}")
                return False
                
        except urllib.error.URLError as e:
            # Network error - retry with backoff
            if attempt < max_retries - 1:
                delay = min(base_delay * (2 ** attempt), 30)
                print(f"Network error: {e.reason}, retrying in {delay}s... (attempt {attempt + 1}/{max_retries})")
                time.sleep(delay)
                continue
            else:
                print(f"Network error after {max_retries} attempts: {e.reason}")
                return False
                
        except Exception as e:
            print(f"Failed to send heartbeat: {e}")
            return False
    
    return False

def main():
    if not adb_exists():
        print("ADB is not installed.\n")
        print("Download Android Platform Tools (official):")
        print("https://developer.android.com/tools/releases/platform-tools")
        sys.exit(1)

    cfg = load_config()

    server_url = cfg["server_url"]
    nickname = cfg["nickname"]
    package = cfg["package_name"]
    interval = cfg.get("check_interval_seconds", 10)

    print(f"🔍 Monitoring started for: {nickname} ({package})")
    print(f"📱 Check interval: {interval} seconds")
    print(f"🌐 Server: {server_url}")
    print("Press Ctrl+C to stop\n")

    # Check initial state
    was_running = is_app_running(package)
    initial_status = "RUNNING" if was_running else "NOT RUNNING"
    print(f"Initial status: {initial_status}")
    
    # Send initial heartbeat
    initial_status_str = "connected" if was_running else "disconnected"
    timestamp_ms = int(time.time() * 1000)
    success = send_heartbeat(server_url, nickname, initial_status_str, timestamp_ms)
    if success:
        print(f"✓ Initial heartbeat sent")
    else:
        print(f"⚠️ Failed to send initial heartbeat")

    try:
        while True:
            running = is_app_running(package)

            if not was_running and running:
                print(f"🚀 {nickname}: App started to run")
                # Send connected heartbeat
                timestamp_ms = int(time.time() * 1000)
                send_heartbeat(server_url, nickname, "connected", timestamp_ms)

            if was_running and not running:
                print(f"⚠️ {nickname}: App crashed or stopped")
                # Send disconnected heartbeat
                timestamp_ms = int(time.time() * 1000)
                success = send_heartbeat(server_url, nickname, "disconnected", timestamp_ms)
                if success:
                    print(f"📨 Heartbeat sent: App stopped")
                else:
                    print(f"❌ Failed to send heartbeat")

            was_running = running
            if was_running:
                print(f"💕 {nickname}: Running & functional")
            else:
                print(f"😭 {nickname}: NOT RUNNING")
            time.sleep(interval)
    except KeyboardInterrupt:
        print("\n\n✓ Monitoring stopped by user")
        sys.exit(0)

if __name__ == "__main__":
    main()

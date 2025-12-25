import subprocess
import time
import json
import sys
import urllib.request
import urllib.parse
import shutil
import uuid
import os

CONFIG_FILE = "mapleting_config.json"

def load_config():
    try:
        with open(CONFIG_FILE, "r", encoding="utf-8") as f:
            config = json.load(f)
    except FileNotFoundError:
        print(f"오류: {CONFIG_FILE} 파일을 찾을 수 없습니다")
        print("설정 마법사를 실행하여 설정 파일을 생성하세요.")
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(f"오류: {CONFIG_FILE} 파일의 JSON 형식이 올바르지 않습니다: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"설정 파일을 불러오는 데 실패했습니다: {e}")
        sys.exit(1)
    
    # Validate required fields
    required_keys = ["server_url", "nickname", "package_name"]
    missing_keys = [key for key in required_keys if key not in config]
    if missing_keys:
        print(f"오류: 필수 설정 키가 누락되었습니다: {', '.join(missing_keys)}")
        sys.exit(1)
    
    return config

def run_setup_wizard():
    print("=" * 60)
    print("           맵플링 (Mapleting) 설정 마법사")
    print("=" * 60)
    print()
    print("설정 파일을 생성하기 위해 다음 정보를 입력해주세요.")
    print()
    
    # Get nickname
    nickname = input("캐릭터/플레이어 이름 (nickname): ").strip()
    while not nickname:
        print("오류: 이름을 입력해야 합니다.")
        nickname = input("캐릭터/플레이어 이름 (nickname): ").strip()
    
    # Get server URL with default
    default_server = "https://mapleting.vercel.app"
    server_url = input(f"서버 주소 (기본값: {default_server}): ").strip()
    if not server_url:
        server_url = default_server
    
    # Get package name with default
    default_package = "com.nexon.ma"
    package = input(f"패키지 이름 (기본값: {default_package}): ").strip()
    if not package:
        package = default_package
    
    # Get check interval with default
    default_interval = 60
    interval_input = input(f"체크 간격 (초, 기본값: {default_interval}): ").strip()
    try:
        interval = int(interval_input) if interval_input else default_interval
    except ValueError:
        print("오류: 유효한 숫자를 입력해야 합니다. 기본값을 사용합니다.")
        interval = default_interval
    
    # Create config dictionary
    config = {
        "server_url": server_url,
        "nickname": nickname,
        "package_name": package,
        "check_interval_seconds": interval
    }
    
    # Write to config file
    try:
        with open(CONFIG_FILE, "w", encoding="utf-8") as f:
            json.dump(config, f, indent=2, ensure_ascii=False)
        print()
        print("✅ 설정 파일이 생성되었습니다.")
        print()
        print("=" * 60)
        print("✅ 설정 완료! 모니터링을 시작합니다...")
        print("=" * 60)
        print()
    except Exception as e:
        print(f"오류: 설정 파일을 생성하는 데 실패했습니다: {e}")
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
        print("오류: server_url이 누락되었습니다")
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
                print(f"서버가 상태 코드 {response.status}를 반환했습니다")
                return False
                
        except urllib.error.HTTPError as e:
            # Handle HTTP errors (4xx, 5xx)
            if e.code == 401:
                print("오류: 인증 실패 - 비밀 키가 올바르지 않습니다")
                print("서버에 등록된 비밀 키와 일치하는지 확인하세요")
                return False
            elif e.code == 404:
                print("오류: 닉네임이 서버에 등록되지 않았습니다")
                print("서버 관리자에게 등록을 요청하세요")
                return False
            elif e.code == 429:
                print("참고: 요청이 너무 많습니다 (Rate limited)")
                return False
            elif e.code >= 500:
                # Server error - retry with backoff
                if attempt < max_retries - 1:
                    delay = min(base_delay * (2 ** attempt), 30)
                    print(f"서버 오류 {e.code}, {delay}초 후 재시도... ({attempt + 1}/{max_retries})")
                    time.sleep(delay)
                    continue
                else:
                    print(f"서버 오류 {e.code}: {e.reason}")
                    return False
            else:
                print(f"HTTP 오류 {e.code}: {e.reason}")
                return False
                
        except urllib.error.URLError as e:
            # Network error - retry with backoff
            if attempt < max_retries - 1:
                delay = min(base_delay * (2 ** attempt), 30)
                print(f"네트워크 오류: {e.reason}, {delay}초 후 재시도... ({attempt + 1}/{max_retries})")
                time.sleep(delay)
                continue
            else:
                print(f"{max_retries}번 시도 후 네트워크 오류 발생: {e.reason}")
                return False
                
        except Exception as e:
            print(f"상태 전송 실패: {e}")
            return False
    
    return False

def main():
    # Check if config file exists, run setup wizard if not
    if not os.path.exists(CONFIG_FILE):
        run_setup_wizard()
    
    if not adb_exists():
        print("ADB가 설치되어 있지 않습니다.")
        print()
        print("Android Platform Tools를 다운로드하세요 (공식):")
        print("https://developer.android.com/tools/releases/platform-tools")
        sys.exit(1)

    cfg = load_config()

    server_url = cfg["server_url"]
    nickname = cfg["nickname"]
    package = cfg["package_name"]
    interval = cfg.get("check_interval_seconds", 10)

    print(f"🔍 모니터링 시작: {nickname} ({package})")
    print(f"📱 체크 간격: {interval}초")
    print(f"🌐 서버: {server_url}")
    print("중지하려면 Ctrl+C를 누르세요\n")

    # Check initial state
    was_running = is_app_running(package)
    initial_status = "실행중" if was_running else "실행안됨"
    print(f"초기 상태: {initial_status}")
    
    # Send initial heartbeat
    initial_status_str = "connected" if was_running else "disconnected"
    timestamp_ms = int(time.time() * 1000)
    success = send_heartbeat(server_url, nickname, initial_status_str, timestamp_ms)
    if success:
        print(f"✅ 초기 상태 업데이트 완료")
    else:
        print(f"⚠️ 초기 상태 업데이트 실패")

    try:
        while True:
            running = is_app_running(package)

            if not was_running and running:
                print(f"🚀 {nickname}: 앱이 시작되었습니다")
                # Send connected heartbeat
                timestamp_ms = int(time.time() * 1000)
                send_heartbeat(server_url, nickname, "connected", timestamp_ms)

            if was_running and not running:
                print(f"⚠️ {nickname}: 앱이 팅겼습니다")
                # Send disconnected heartbeat
                timestamp_ms = int(time.time() * 1000)
                success = send_heartbeat(server_url, nickname, "disconnected", timestamp_ms)
                if success:
                    print(f"📨 상태 업데이트 완료: 앱 중단 알림 전송")
                else:
                    print(f"❌ 상태 업데이트 실패")

            # Normal status output suppressed - only show on state transitions or errors
            was_running = running
            time.sleep(interval)
    except KeyboardInterrupt:
        print("\n\n✅ 사용자에 의해 모니터링이 중단되었습니다")
        return

if __name__ == "__main__":
    main()

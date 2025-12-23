# Mapleting Python Client

Python-based monitoring agent for the Mapleting system. Monitors Android applications via ADB and sends heartbeat updates to the Next.js server.

## Features

- **Lightweight**: Uses only Python standard library (no external dependencies)
- **Cross-Platform**: Works on Windows, macOS, and Linux
- **Unicode Support**: Full UTF-8 support for non-English nicknames
- **State Detection**: Monitors app status transitions (running → stopped)
- **Configurable**: JSON-based configuration file
- **Standalone Executable**: Can be built as a single binary with PyInstaller

## Prerequisites

Before you begin, ensure you have the following:

### Required Software

1. **Python 3.8+**
   - Download from [python.org](https://www.python.org/downloads/)
   - Verify installation: `python --version`

2. **Android Debug Bridge (ADB)**
   - Part of Android Platform Tools
   - Download from [developer.android.com](https://developer.android.com/tools/releases/platform-tools)
   - Verify installation: `adb --version`

### Android Device Setup

1. **Enable USB Debugging**:
   - Go to **Settings** → **About Phone**
   - Tap **Build Number** 7 times to enable Developer Options
   - Go to **Settings** → **Developer Options**
   - Enable **USB Debugging**

2. **Connect Device**:
   - Connect your Android device via USB
   - Accept the debugging prompt on the device
   - Verify connection: `adb devices`

   Expected output:
   ```
   List of devices attached
   DEVICE_ID    device
   ```

## Installation

### Option 1: Run from Source

1. **Clone or Download** this repository:
   ```bash
   cd client
   ```

2. **Verify Python Script**:
   ```bash
   python monitor.py --help
   ```

3. **Configure** (see Configuration section below)

4. **Run the Monitor**:
   ```bash
   python monitor.py
   ```

### Option 2: Build Standalone Executable

For distribution or running without Python installed:

1. **Install PyInstaller**:
   ```bash
   pip install pyinstaller
   ```

2. **Build Executable**:
   ```bash
   pyinstaller monitor.spec
   ```

   This creates a standalone binary in `dist/monitor`:
   - **Linux/macOS**: `dist/monitor`
   - **Windows**: `dist/monitor.exe`

3. **Run the Executable**:
   ```bash
   # Linux/macOS
   ./dist/monitor

   # Windows
   dist\monitor.exe
   ```

## Configuration

The client uses a `config.json` file for configuration. Copy the example file:

```bash
cp config.json.example config.json
```

Edit `config.json` with your settings:

```json
{
  "server_url": "https://your-server.com",
  "nickname": "테스트-장치-01",
  "secret": "your-per-nickname-secret",
  "package_name": "com.example.app",
  "check_interval_seconds": 3
}
```

### Configuration Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `server_url` | string | ✅ Yes | URL of the Next.js server (e.g., `https://your-server.com`) |
| `nickname` | string | ✅ Yes | Display name for this device (UTF-8, any language) |
| `secret` | string | ✅ Yes | Per-nickname secret for authentication (get from server admin) |
| `package_name` | string | ✅ Yes | Android package name to monitor (e.g., `com.nexon.ma`) |
| `check_interval_seconds` | number | ❌ No | How often to check app status (default: 3 seconds) |

### Finding Your Package Name

To find the package name of an installed app:

```bash
# List all installed packages
adb shell pm list packages

# Search for specific app
adb shell pm list packages | grep -i keyword
```

Common package names:
- **MapleStory M**: `com.nexon.ma`
- **MapleStory Worlds**: `com.nexon.msw`
- **YouTube**: `com.google.android.youtube`
- **Chrome**: `com.android.chrome`

## Usage

### Running the Monitor

**From Source**:
```bash
python monitor.py
```

**Standalone Executable**:
```bash
# Linux/macOS
./monitor

# Windows
monitor.exe
```

### Expected Output

When started successfully:

```
🔍 Monitoring started for: 테스트-장치-01 (com.nexon.ma)
📱 Check interval: 3 seconds
Press Ctrl+C to stop

Initial status: RUNNING
```

While monitoring:
- No output = app still running (no state change)
- Status messages appear when app starts or stops

### Stopping the Monitor

Press `Ctrl+C` to stop monitoring gracefully:

```
^C

✓ Monitoring stopped by user
```

## How It Works

### Monitoring Logic

1. **Initial State Check**: Determines if app is currently running
2. **Periodic Checks**: Every `check_interval_seconds`, checks app status via ADB
3. **State Detection**: Detects transitions:
   - **Stopped → Running**: Logs to console
   - **Running → Stopped**: Sends heartbeat to server
4. **Heartbeat Transmission**: Sends POST request to server with:
   - Nickname (UTF-8 encoded)
   - Status (`"connected"` or `"disconnected"`)
   - Current timestamp (milliseconds since epoch)

### ADB Monitoring

The monitor uses ADB to check if an app is running:

```bash
adb shell ps
```

This command lists all running processes. The monitor searches for the package name in the output.

### Server Communication

The client sends HTTP POST requests to the server:

**Endpoint**: `POST /api/heartbeat`

**Headers**:
```
Content-Type: application/json
Authorization: Bearer <your-secret>
```

**Body**:
```json
{
  "nickname": "테스트-장치-01",
  "status": "disconnected",
  "timestamp": 1734850000000
}
```

**Response**:
- `200 OK`: Heartbeat received successfully
- `401 Unauthorized`: Invalid secret (check configuration)
- `404 Not Found`: Nickname not registered on server
- `500 Internal Server Error`: Server error (try again later)

## Troubleshooting

### ADB Issues

**Problem**: `ADB is not installed` error

**Solution**:
1. Download Android Platform Tools: [developer.android.com](https://developer.android.com/tools/releases/platform-tools)
2. Add to system PATH:
   - **Windows**: Add `C:\path\to\platform-tools` to Environment Variables
   - **macOS**: Add to `~/.zshrc` or `~/.bash_profile`:
     ```bash
     export PATH=$PATH:/path/to/platform-tools
     ```
   - **Linux**: Add to `~/.bashrc`:
     ```bash
     export PATH=$PATH:/path/to/platform-tools
     ```
3. Verify: `adb --version`

**Problem**: `adb devices` shows "unauthorized"

**Solution**:
1. Revoke USB debugging on device:
   - Settings → Developer Options → Revoke USB debugging authorization
2. Disconnect and reconnect USB cable
3. Accept debugging prompt on device
4. Run `adb devices` again

**Problem**: `adb devices` shows "offline"

**Solution**:
1. Restart ADB server:
   ```bash
   adb kill-server
   adb start-server
   ```
2. Reconnect device
3. If still offline, restart device

### Configuration Issues

**Problem**: `config.json not found` error

**Solution**:
1. Ensure `config.json` exists in the same directory as `monitor.py`
2. Copy from example: `cp config.json.example config.json`
3. Verify file is readable: `cat config.json`

**Problem**: `Invalid JSON in config.json` error

**Solution**:
1. Validate JSON syntax: [jsonlint.com](https://jsonlint.com/)
2. Check for:
   - Missing commas between fields
   - Trailing commas (not allowed in JSON)
   - Unquoted strings
   - Single quotes (use double quotes)
3. Use JSON editor or linter

**Problem**: `Missing required config keys` error

**Solution**:
Ensure all required fields are present in `config.json`:
- `server_url`
- `nickname`
- `secret`
- `package_name`

### Network Issues

**Problem**: Failed to connect to server

**Solutions**:
1. Verify server URL is correct (check for typos)
2. Test server accessibility:
   ```bash
   curl https://your-server.com/api/heartbeat
   ```
3. Check firewall settings
4. Verify SSL certificate (if using HTTPS)
5. Check server logs for errors

**Problem**: `401 Unauthorized` response

**Solutions**:
1. Verify secret matches server configuration
2. Contact server administrator to confirm nickname is registered
3. Check for extra spaces or characters in secret field

**Problem**: `404 Not Found` response

**Solutions**:
1. Verify nickname exists on server
2. Contact server administrator to register nickname
3. Check server URL is correct

### App Detection Issues

**Problem**: App not detected as running

**Solutions**:
1. Verify package name is correct:
   ```bash
   adb shell pm list packages | grep your-package-name
   ```
2. Check if app is actually running:
   ```bash
   adb shell ps | grep your-package-name
   ```
3. Some apps use different process names - check with `adb shell ps`
4. Try launching the app first, then start monitor

**Problem**: False positives (app detected as running when not)

**Solutions**:
1. Some apps have background services that persist
2. Check actual app behavior with `adb shell dumpsys activity top`
3. Consider monitoring specific activities instead of package name

### Performance Issues

**Problem**: High CPU usage

**Solutions**:
1. Increase `check_interval_seconds` in config (e.g., 5 or 10 seconds)
2. Check ADB version (update if old)
3. Close unnecessary ADB sessions: `adb kill-server`

**Problem**: Memory usage growing over time

**Solutions**:
1. This is unusual - report as bug if observed
2. Restart monitor periodically (add to cron/systemd)
3. Check for memory leaks in Python version

## Advanced Usage

### Running as System Service

#### Linux (systemd)

Create `/etc/systemd/system/mapleting-monitor.service`:

```ini
[Unit]
Description=Mapleting Monitor
After=network.target

[Service]
Type=simple
User=your-username
WorkingDirectory=/path/to/client
ExecStart=/usr/bin/python3 /path/to/client/monitor.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable mapleting-monitor
sudo systemctl start mapleting-monitor
```

Check status:
```bash
sudo systemctl status mapleting-monitor
```

View logs:
```bash
sudo journalctl -u mapleting-monitor -f
```

#### macOS (launchd)

Create `~/Library/LaunchAgents/com.mapleting.monitor.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.mapleting.monitor</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/bin/python3</string>
        <string>/path/to/client/monitor.py</string>
    </array>
    <key>WorkingDirectory</key>
    <string>/path/to/client</string>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
</dict>
</plist>
```

Load service:
```bash
launchctl load ~/Library/LaunchAgents/com.mapleting.monitor.plist
```

#### Windows (Task Scheduler)

1. Open Task Scheduler
2. Create Basic Task
3. Name: "Mapleting Monitor"
4. Trigger: At startup
5. Action: Start a program
   - Program: `C:\path\to\python.exe`
   - Arguments: `C:\path\to\client\monitor.py`
   - Start in: `C:\path\to\client`
6. Finish and enable task

### Monitoring Multiple Devices

Create separate configuration files for each device:

```bash
cp config.json config-device1.json
cp config.json config-device2.json
```

Edit each config with unique nickname and package.

Run multiple instances:
```bash
python monitor.py config-device1.json &
python monitor.py config-device2.json &
```

### Logging

To enable logging, modify `monitor.py` or redirect output:

```bash
# Redirect to file
python monitor.py >> monitor.log 2>&1

# Rotate logs with logrotate
python monitor.py 2>&1 | logger -t mapleting-monitor
```

## Migration from Telegram

If you're currently using the Telegram-based monitor:

### Changes Required

1. **Update Configuration**:
   ```json
   {
     "server_url": "https://your-new-server.com",
     "nickname": "your-nickname",
     "secret": "your-new-secret",
     "package_name": "com.example.app",
     "check_interval_seconds": 3
   }
   ```

2. **Remove Old Fields**:
   - Remove `telegram_token`
   - Remove `telegram_chat_id`

3. **Add New Fields**:
   - Add `server_url`
   - Add `secret`

4. **Test New System**:
   - Start monitor with new config
   - Verify heartbeats are sent to server
   - Check server logs for incoming requests

### Benefits of Migration

- **Cross-platform**: Works on iOS, macOS, Windows, Linux
- **Native notifications**: OS-integrated push notifications
- **Better Unicode**: Full UTF-8 support
- **No dependencies**: No external messaging service required
- **Self-hosted**: Full control over data

## Development

### Project Structure

```
client/
├── monitor.py           # Main monitoring script
├── config.json          # Configuration file (not in version control)
├── config.json.example  # Configuration template
├── monitor.spec         # PyInstaller build spec
└── package_list.txt     # Reference package list
```

### Code Overview

**Main Functions**:

- `load_config()`: Loads and validates `config.json`
- `adb_exists()`: Checks if ADB is installed
- `is_app_running(package)`: Checks if app is running via ADB
- `send_heartbeat()`: Sends heartbeat to server (future implementation)
- `main()`: Main monitoring loop

### Testing

Test with mock data:

```python
# In monitor.py, replace:
running = is_app_running(package)

# With:
running = True  # Force running state
# or
running = False  # Force stopped state
```

## Support

For issues, questions, or contributions:

- **Server Documentation**: See [`../server/README.md`](../server/README.md:1)
- **Deployment Guide**: See [`../DEPLOYMENT.md`](../DEPLOYMENT.md:1)
- **API Reference**: See [`../server/API.md`](../server/API.md:1)

## License

MIT License - See LICENSE file for details
# MapleTing PWA Server

Next.js-based PWA server for the MapleTing monitoring and notification system. Receives heartbeats from Python client agents and delivers cross-platform push notifications to subscribers.

## Features

- **Cross-Platform Push Notifications**: Web Push API support for Android, iOS 16.4+, Windows, macOS, and Linux
- **PWA Installability**: Install as native app on supported platforms
- **UTF-8 First**: Full Unicode support for non-English nicknames
- **Real-time Monitoring**: State transition detection and instant notifications
- **Supabase Integration**: Managed PostgreSQL database with excellent TypeScript support
- **Type-Safe**: Full TypeScript implementation

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: 18.17+ or 20.x ([Download](https://nodejs.org/))
- **Bun**: Package manager ([Install](https://bun.sh/))
- **Supabase Account**: Free tier works ([Sign up](https://supabase.com/))
- **Git**: For version control

## Installation

### 1. Clone the Repository

```bash
cd server
```

### 2. Install Dependencies

```bash
bun install
```

### 3. Generate VAPID Keys

VAPID keys are required for Web Push API authentication:

```bash
npx web-push generate-vapid-keys
```

You'll see output like:

```
=======================================
Public Key:
YOUR_PUBLIC_KEY_HERE
Private Key:
YOUR_PRIVATE_KEY_HERE
=======================================
```

**Important**: Save these keys securely. You'll need them for environment configuration.

### 4. Set Up Supabase Database

#### Create a Supabase Project

1. Go to [supabase.com](https://supabase.com/)
2. Create a new project
3. Wait for the project to be provisioned (2-3 minutes)

#### Run Database Schema

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Copy the contents of [`lib/schema.sql`](lib/schema.sql:1)
4. Paste into the SQL Editor
5. Click **Run** to execute

This will create:

- `nicknames` table (monitored devices/applications)
- `push_subscriptions` table (user notification subscriptions)
- Required indexes for performance

#### Get Supabase Credentials

1. In your Supabase project, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (under "Project API keys")
   - **anon public** key (under "Project API keys")
   - **service_role** key (under "Project API secrets" - keep this secret!)

### 5. Configure Environment Variables

Create a `.env.local` file in the `server` directory:

```bash
# Copy the example file
cp .env.local.example .env.local
```

Edit `.env.local` with your values:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key-here"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key-here"

# Web Push (VAPID) Configuration
NEXT_PUBLIC_VAPID_PUBLIC_KEY="your-public-key-from-step-3"
VAPID_PRIVATE_KEY="your-private-key-from-step-3"
VAPID_SUBJECT="mailto:admin@example.com"  # Change to your email

# Application Configuration
APP_BASE_URL="http://localhost:3000"  # Change for production
NODE_ENV="development"
```

**Important**:

- Never commit `.env.local` to version control
- Keep `VAPID_PRIVATE_KEY` and `SUPABASE_SERVICE_ROLE_KEY` secure
- The `SUPABASE_SERVICE_ROLE_KEY` bypasses RLS - use with caution

### 6. Start Development Server

```bash
bun dev
```

The server will start at [http://localhost:3000](http://localhost:3000)

## Development

### Project Structure

```
server/
├── app/
│   ├── api/
│   │   ├── heartbeat/      # POST /api/heartbeat endpoint
│   │   ├── subscribe/      # POST /api/subscribe endpoint
│   │   └── unsubscribe/    # POST /api/unsubscribe endpoint
│   ├── n/[encodedNickname]/ # Nickname detail pages
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Home page
├── components/
│   └── subscription-button.tsx  # Push subscription UI component
├── lib/
│   ├── db.ts               # Supabase client configuration
│   ├── push-client.ts      # Web Push API client
│   ├── push.ts             # Push notification utilities
│   ├── types.ts            # TypeScript type definitions
│   ├── url-utils.ts        # URL encoding utilities
│   ├── repositories/       # Data access layer
│   │   ├── nickname-repository.ts
│   │   └── subscription-repository.ts
│   └── schema.sql          # Database schema
├── public/
│   ├── manifest.json       # PWA manifest
│   ├── sw.js               # Service worker
│   └── icons/              # PWA icons
└── package.json
```

### Available Scripts

```bash
# Start development server
bun dev

# Build for production
bun run build

# Start production server
bun start

# Run linter
bun run lint

# Type check
bun run type-check
```

### PWA Testing

To test PWA functionality:

1. **Install the PWA**:

   - Open [http://localhost:3000](http://localhost:3000) in Chrome/Edge
   - Look for the install icon in the address bar
   - Click "Install" to add to your home screen

2. **Test Push Notifications**:

   - Subscribe to a nickname on the home page
   - Use the Python client to send a heartbeat
   - Verify notification appears

3. **Service Worker Testing**:
   - Open DevTools → Application → Service Workers
   - Verify service worker is active
   - Check for console errors

## API Endpoints

The server provides three main API endpoints:

### POST /api/heartbeat

Receives status updates from Python client agents.

**Authentication**: `Authorization: Bearer <nickname-secret>`

**Request Body**:

```json
{
	"nickname": "테스트-장치-01",
	"status": "connected",
	"timestamp": 1734850000000
}
```

**Response**: `200 OK` on success

### POST /api/subscribe

Subscribe to notifications for a nickname.

**Request Body**:

```json
{
	"nickname": "テスト-장치-01",
	"subscription": {
		"endpoint": "https://fcm.googleapis.com/...",
		"keys": {
			"p256dh": "B...",
			"auth": "A..."
		}
	}
}
```

**Response**: `200 OK` with subscription ID

### POST /api/unsubscribe

Cancel push notification subscription.

**Request Body**:

```json
{
	"subscriptionId": "uuid"
}
```

**Response**: `200 OK` on success

For detailed API documentation, see [`API.md`](API.md:1).

## Production Deployment

### Deploy to Vercel

1. **Install Vercel CLI**:

   ```bash
   bun install -g vercel
   ```

2. **Deploy**:

   ```bash
   vercel
   ```

3. **Configure Environment Variables**:

   - Go to your Vercel project dashboard
   - Navigate to **Settings** → **Environment Variables**
   - Add all variables from `.env.local` (except `NODE_ENV`)

4. **Update APP_BASE_URL**:
   - Change `APP_BASE_URL` to your production domain
   - Example: `https://your-app.vercel.app`

### Self-Hosted Deployment

You can deploy to any Node.js hosting platform:

1. **Build the application**:

   ```bash
   bun run build
   ```

2. **Start production server**:

   ```bash
   bun start
   ```

3. **Configure reverse proxy** (nginx example):
   ```nginx
   server {
       listen 443 ssl;
       server_name your-domain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

**Important**: Web Push API requires HTTPS. Use a valid SSL certificate.

## Troubleshooting

### Database Connection Issues

**Problem**: Cannot connect to Supabase

**Solutions**:

- Verify `NEXT_PUBLIC_SUPABASE_URL` is correct
- Check `NEXT_PUBLIC_SUPABASE_ANON_KEY` matches your Supabase project
- Ensure your Supabase project is active (not paused)
- Check Supabase logs for connection errors

### Push Notifications Not Working

**Problem**: Notifications not being delivered

**Solutions**:

- Verify VAPID keys are correctly set in `.env.local`
- Check browser console for push subscription errors
- Ensure `NEXT_PUBLIC_VAPID_PUBLIC_KEY` matches your VAPID key pair
- Test push notification delivery with web-push library:
  ```bash
  npx web-push send-notification <subscription-endpoint> <payload>
  ```

### Service Worker Registration Fails

**Problem**: Service worker won't register

**Solutions**:

- Ensure you're accessing via HTTPS or localhost
- Clear browser cache and service workers:
  - DevTools → Application → Service Workers → Unregister
- Check `public/sw.js` exists and is accessible
- Verify `public/manifest.json` is valid JSON

### Unicode Nicknames Display Incorrectly

**Problem**: Non-English nicknames show garbled text

**Solutions**:

- Ensure database schema uses UTF-8 encoding (Supabase default)
- Verify nicknames are stored as TEXT (not VARCHAR)
- Check that URL encoding/decoding is working correctly
- Test with various Unicode characters (Korean, Japanese, Chinese)

### Environment Variables Not Loading

**Problem**: `process.env` variables are undefined

**Solutions**:

- Ensure `.env.local` is in the `server/` directory
- Restart development server after adding variables
- Verify variable names match exactly (case-sensitive)
- Check for typos in variable names
- Never prefix with `EXPO_` or other frameworks

### Build Errors

**Problem**: TypeScript or build errors

**Solutions**:

- Ensure all dependencies are installed: `bun install`
- Check Node.js version: `node --version` (should be 18.17+ or 20.x)
- Clear Next.js cache: `rm -rf .next`
- Reinstall dependencies: `rm -rf node_modules && bun install`

## Security Considerations

### Secrets Management

- **Never commit** `.env.local` or any environment files
- **Rotate VAPID keys** periodically
- **Use different secrets** for development and production
- **Limit service role key** access to server-side code only

### Rate Limiting

The `/api/heartbeat` endpoint implements per-nickname rate limiting:

- **Limit**: 1 request per second per nickname
- **Implementation**: In-memory token bucket
- **Production**: Consider Redis for distributed rate limiting

### Database Security

For production, consider enabling Row Level Security (RLS):

```sql
-- Enable RLS
ALTER TABLE nicknames ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Create appropriate policies
-- Example: Allow anyone to read nicknames
CREATE POLICY "Public read access" ON nicknames
  FOR SELECT USING (true);
```

## Monitoring and Logs

### Server Logs

```bash
# Development
bun dev

# Production (systemd)
journalctl -u mapleting-server -f
```

### Key Metrics to Monitor

- Heartbeat rate per nickname
- Push notification success rate
- API error rates (4xx, 5xx)
- Response times (p50, p95, p99)
- Database connection pool usage

## Support

For issues, questions, or contributions:

- **Documentation**: See [`../DEPLOYMENT.md`](../DEPLOYMENT.md:1) for deployment guide
- **API Reference**: See [`API.md`](API.md:1) for detailed API documentation
- **Python Client**: See [`../client/README.md`](../client/README.md:1)

## License

MIT License - See LICENSE file for details

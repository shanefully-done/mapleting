# MapleTing Deployment Guide

Complete guide for deploying the MapleTing monitoring system to production, including Supabase database setup, Vercel deployment, and Python client distribution.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Supabase Setup](#supabase-setup)
- [Vercel Deployment](#vercel-deployment)
- [Self-Hosted Deployment](#self-hosted-deployment)
- [Environment Variables](#environment-variables)
- [Client Distribution](#client-distribution)
- [Production Considerations](#production-considerations)
- [Monitoring and Maintenance](#monitoring-and-maintenance)
- [Troubleshooting](#troubleshooting)

## Overview

MapleTing consists of two main components that need to be deployed:

1. **Next.js Server** (PWA + API) - Deployed to Vercel or self-hosted
2. **Python Client** (Monitoring Agent) - Distributed as standalone executable

This guide covers deploying both components to production.

## Prerequisites

Before deploying to production, ensure you have:

- **Supabase Account**: Free tier works for most use cases
- **Vercel Account**: Free tier available ([vercel.com](https://vercel.com))
- **Domain Name** (optional): For custom domain on Vercel
- **Git Repository**: GitHub, GitLab, or Bitbucket for Vercel deployment
- **Code Editor**: For editing configuration files
- **Basic Knowledge**: Terminal/command line usage

## Supabase Setup

Supabase provides the PostgreSQL database for the MapleTing server.

### Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com/)
2. Click **"Start your project"**
3. Sign up or log in
4. Click **"New Project"**
5. Fill in project details:
   - **Name**: `mapleting` (or your preferred name)
   - **Database Password**: Generate a strong password (save it securely)
   - **Region**: Choose region closest to your users
6. Click **"Create new project"**
7. Wait for project provisioning (2-3 minutes)

### Step 2: Run Database Schema

1. In your Supabase project dashboard, navigate to **SQL Editor** in the left sidebar
2. Click **"New Query"**
3. Copy the contents of [`server/lib/schema.sql`](server/lib/schema.sql:1)
4. Paste into the SQL Editor
5. Review the SQL (optional)
6. Click **"Run"** (or press `Cmd/Ctrl + Enter`)

This creates:

- `nicknames` table (monitored devices/applications)
- `push_subscriptions` table (user notification subscriptions)
- Required indexes for performance

**Verification**:

```sql
-- Verify tables were created
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public';
```

Expected output:

```
table_name
-----------
nicknames
push_subscriptions
```

### Step 3: Get Supabase Credentials

1. In your Supabase project, go to **Settings** → **API**
2. Copy the following values:

**Project Configuration**:

- **Project URL**: Under "Project API keys"
  ```
  https://xxxxxxxxxxxxx.supabase.co
  ```

**API Keys**:

- **anon public**: Under "Project API keys"

  ```
  eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  ```

- **service_role**: Under "Project API secrets" (click "show" to reveal)
  ```
  eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  ```

**Important Security Notes**:

- The `anon` key is safe to expose in client-side code
- The `service_role` key bypasses Row Level Security (RLS) - **never expose it**
- Store these securely - you'll need them for environment configuration

### Step 4: Create First Nickname (Optional)

You can create nicknames via the Supabase dashboard or API:

**Via Supabase Dashboard**:

1. Go to **Table Editor** in left sidebar
2. Select the `nicknames` table
3. Click **"Insert row"**
4. Fill in fields:
   - `id`: Generate a UUID (use [uuidgenerator.net](https://uuidgenerator.net))
   - `nickname`: Display name (e.g., `"테스트-장치-01"`)
   - `secret`: Generate a strong random string (use `openssl rand -base64 32`)
   - `last_status`: `"connected"`
   - `last_seen_at`: Current timestamp in milliseconds
   - `created_at`: Current timestamp in milliseconds

**Example SQL**:

```sql
INSERT INTO nicknames (id, nickname, secret, last_status, last_seen_at, created_at)
VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  '테스트-장치-01',
  'your-generated-secret-here',
  'connected',
  EXTRACT(EPOCH FROM NOW()) * 1000,
  EXTRACT(EPOCH FROM NOW()) * 1000
);
```

Save the `secret` - you'll need it for the Python client configuration.

## Vercel Deployment

Vercel is the recommended platform for deploying the Next.js server.

### Step 1: Prepare for Deployment

1. **Push to Git Repository**:

   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/your-username/mapleting.git
   git push -u origin main
   ```

2. **Generate VAPID Keys**:

   ```bash
   npx web-push generate-vapid-keys
   ```

   Save both keys securely.

### Step 2: Deploy to Vercel

**Option A: Via Vercel CLI**

1. **Install Vercel CLI**:

   ```bash
   bun install -g vercel
   ```

2. **Login to Vercel**:

   ```bash
   vercel login
   ```

3. **Deploy from server directory**:

   ```bash
   cd server
   vercel
   ```

4. **Follow the prompts**:

   - **Set up and deploy?**: `Y`
   - **Which scope?**: Select your account
   - **Link to existing project?**: `N`
   - **What's your project's name?**: `mapleting` (or your preferred name)
   - **In which directory is your code located?**: `./` (current directory)
   - **Override settings?**: `N` (we'll configure later)

5. **Copy the deployment URL**:
   ```
   ✅ Production: https://mapleting.vercel.app
   ```

**Option B: Via Vercel Dashboard**

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your Git repository
3. Configure:
   - **Framework Preset**: Next.js
   - **Root Directory**: `server`
   - **Build Command**: `bun run build`
   - **Output Directory**: `.next`
4. Click **"Deploy"**

### Step 3: Configure Environment Variables

1. **Go to your Vercel project dashboard**
2. Navigate to **Settings** → **Environment Variables**
3. Add the following variables:

**Supabase Configuration**:

```
NEXT_PUBLIC_SUPABASE_URL = https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Web Push (VAPID) Configuration**:

```
NEXT_PUBLIC_VAPID_PUBLIC_KEY = YOUR_PUBLIC_KEY_HERE
VAPID_PRIVATE_KEY = YOUR_PRIVATE_KEY_HERE
VAPID_SUBJECT = mailto:admin@example.com
```

**Application Configuration**:

```
APP_BASE_URL = https://mapleting.vercel.app
NODE_ENV = production
```

**Important Notes**:

- Use the exact variable names (case-sensitive)
- No quotes around values
- Click "Save" after adding each variable
- Variables apply to all environments by default (can be restricted)

### Step 4: Redeploy with Environment Variables

After adding environment variables:

1. **Go to Deployments tab** in Vercel dashboard
2. **Click the three dots** next to the latest deployment
3. **Select "Redeploy"**
4. **Click "Redeploy"** again to confirm

### Step 5: Configure Custom Domain (Optional)

1. **Go to Settings** → **Domains**
2. **Add your domain**: `mapleting.example.com`
3. **Choose how to configure**:
   - **Option A**: Recommended - Add A record
   - **Option B**: Add CNAME record
4. **Update your DNS** at your domain registrar
5. **Wait for DNS propagation** (can take up to 24 hours, usually faster)
6. **Update `APP_BASE_URL`** in Vercel environment variables

### Step 6: Verify Deployment

1. **Visit your deployment URL**:

   ```
   https://mapleting.vercel.app
   ```

2. **Check PWA Installability**:

   - Open Chrome DevTools → Application
   - Verify "Manifest" is found
   - Verify "Service Worker" is active

3. **Test API Endpoints**:

   ```bash
   # Test heartbeat endpoint (should return 401 without auth)
   curl -X POST https://mapleting.vercel.app/api/heartbeat \
     -H "Content-Type: application/json" \
     -d '{"nickname":"test","status":"connected","timestamp":1234567890000}'
   ```

4. **Check Vercel Logs**:
   - Go to Deployments → Latest Deployment → Function Logs
   - Verify no errors

## Self-Hosted Deployment

For full control, you can deploy to your own server.

### Step 1: Prepare Server

**Requirements**:

- Ubuntu 20.04+ or similar Linux distribution
- Node.js 18.17+ or 20.x
- 1GB RAM minimum (2GB recommended)
- 10GB disk space
- SSL certificate (required for Web Push API)

### Step 2: Install Node.js and Bun

```bash
# Install Node.js (using NodeSource)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Bun
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc  # or restart shell
```

### Step 3: Clone and Build

```bash
# Clone repository
git clone https://github.com/your-username/mapleting.git
cd mapleting/server

# Install dependencies
bun install

# Create environment file
cp .env.local.example .env.local
nano .env.local  # Edit with your credentials

# Build application
bun run build
```

### Step 4: Set Up SSL with Let's Encrypt

```bash
# Install certbot
sudo apt-get install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d mapleting.example.com

# Auto-renewal is configured automatically
```

### Step 5: Configure PM2 (Process Manager)

```bash
# Install PM2
sudo npm install -g pm2

# Start application
pm2 start npm --name "mapleting" -- start

# Save PM2 configuration
pm2 save

# Configure PM2 to start on boot
pm2 startup
# Follow the instructions output by the command
```

### Step 6: Configure Nginx Reverse Proxy

Create `/etc/nginx/sites-available/mapleting`:

```nginx
server {
    listen 443 ssl http2;
    server_name mapleting.example.com;

    ssl_certificate /etc/letsencrypt/live/mapleting.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/mapleting.example.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name mapleting.example.com;
    return 301 https://$server_name$request_uri;
}
```

Enable site:

```bash
sudo ln -s /etc/nginx/sites-available/mapleting /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Step 7: Verify Deployment

```bash
# Check PM2 status
pm2 status

# Check logs
pm2 logs mapleting

# Test application
curl https://mapleting.example.com
```

## Environment Variables

Complete reference for all environment variables.

### Supabase Configuration

```bash
# Supabase Project URL
NEXT_PUBLIC_SUPABASE_URL="https://xxxxxxxxxxxxx.supabase.co"

# Supabase Anonymous Key (safe to expose)
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Supabase Service Role Key (NEVER expose in client code)
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Web Push (VAPID) Configuration

```bash
# VAPID Public Key (used in client-side code)
NEXT_PUBLIC_VAPID_PUBLIC_KEY="YOUR_PUBLIC_KEY_HERE"

# VAPID Private Key (server-side only)
VAPID_PRIVATE_KEY="YOUR_PRIVATE_KEY_HERE"

# VAPID Subject (contact email or URL)
VAPID_SUBJECT="mailto:admin@example.com"
```

### Application Configuration

```bash
# Application Base URL (without trailing slash)
APP_BASE_URL="https://mapleting.example.com"

# Environment
NODE_ENV="production"
```

### Environment-Specific Values

**Development**:

```bash
APP_BASE_URL="http://localhost:3000"
NODE_ENV="development"
```

**Production (Vercel)**:

```bash
APP_BASE_URL="https://your-app.vercel.app"
NODE_ENV="production"
```

**Production (Self-Hosted)**:

```bash
APP_BASE_URL="https://your-domain.com"
NODE_ENV="production"
```

## Client Distribution

Distribute the Python client to users who need to monitor Android applications.

### Option 1: Standalone Executable (Recommended)

Build standalone executables for each platform:

**Windows**:

```bash
# On Windows machine
cd client
pip install pyinstaller
pyinstaller --onefile --name MapleTingMonitor monitor.py

# Executable will be in dist/MapleTingMonitor.exe
```

**Linux**:

```bash
cd client
pip install pyinstaller
pyinstaller --onefile --name mapleting-monitor monitor.spec

# Executable will be in dist/mapleting-monitor
```

**macOS**:

```bash
cd client
pip install pyinstaller
pyinstaller --onefile --name MapleTingMonitor monitor.spec

# Executable will be in dist/MapleTingMonitor
```

**Distribution Package**:

```bash
# Create distribution package
cd dist
zip mapleting-monitor-windows.zip MapleTingMonitor.exe
zip mapleting-monitor-linux.zip mapleting-monitor
zip mapleting-monitor-macos.zip MapleTingMonitor

# Include README and config example
cp ../README.md .
cp ../config.json.example .
zip -u mapleting-monitor-*.zip README.md config.json.example
```

### Option 2: Source Distribution

For users with Python installed:

```bash
# Create source distribution
cd client
tar -czf mapleting-monitor-source.tar.gz \
  monitor.py \
  config.json.example \
  README.md
```

### Option 3: Package Managers (Advanced)

**PyPI (Python Package Index)**:

```bash
# Create setup.py
cat > setup.py << 'EOF'
from setuptools import setup

setup(
    name="mapleting-monitor",
    version="1.0.0",
    py_modules=["monitor"],
    install_requires=[],
    entry_points={
        'console_scripts': [
            'mapleting-monitor=monitor:main',
        ],
    },
)
EOF

# Build and upload
python setup.py sdist
twine upload dist/mapleting-monitor-1.0.0.tar.gz
```

**Homebrew (macOS)**:
Create a Homebrew formula for easy installation.

### Distribution Instructions for Users

Include these instructions with the distributed client:

1. **Extract the archive**
2. **Copy `config.json.example` to `config.json`**
3. **Edit `config.json` with your settings**:
   ```json
   {
   	"server_url": "https://your-server.com",
   	"nickname": "your-device-name",
   	"secret": "your-secret-from-server-admin",
   	"package_name": "com.example.app",
   	"check_interval_seconds": 3
   }
   ```
4. **Run the monitor**:
   - **Windows**: Double-click `MapleTingMonitor.exe`
   - **Linux/macOS**: `./mapleting-monitor` or `python monitor.py`

## Production Considerations

### Security

**1. Secrets Management**:

- Never commit `.env.local` or secrets to version control
- Rotate VAPID keys periodically (every 6-12 months)
- Use strong, random secrets for nicknames (32+ characters)
- Enable Supabase RLS policies in production

**2. Rate Limiting**:
The `/api/heartbeat` endpoint implements per-nickname rate limiting:

- **Limit**: 1 request per second per nickname
- **Production**: Consider using Redis for distributed rate limiting

**3. SSL/TLS**:

- Web Push API requires HTTPS
- Use valid SSL certificates (Let's Encrypt is free)
- Never use self-signed certificates in production

### Performance

**1. Database Indexing**:
Indexes are already created in [`schema.sql`](server/lib/schema.sql:1):

```sql
CREATE INDEX idx_nicknames_nickname ON nicknames(nickname);
CREATE INDEX idx_subscriptions_nicknameId ON push_subscriptions(nickname_id);
```

**2. Connection Pooling**:
Supabase provides automatic connection pooling. No additional configuration needed.

**3. Caching Strategy**:
Consider caching nickname → UUID resolution:

- **In-Memory Cache**: Simple, effective for single-instance deployments
- **Redis**: For distributed deployments
- **TTL**: 5 minutes recommended

### Scalability

**Current Limits (Single Instance)**:

- Nicknames: 10,000
- Subscriptions: 100,000
- Notifications/second: 1,000

**Scaling Strategies**:

1. **Multiple Next.js Instances**:

   - Use load balancer (Vercel handles this automatically)
   - Shared database (Supabase)
   - Redis for distributed rate limiting

2. **Message Queue**:

   - Queue push notifications instead of sending synchronously
   - Process notifications with background workers
   - Better handling of slow/broken push endpoints

3. **Database Optimization**:
   - Partition subscriptions table by nickname_id
   - Archive old subscriptions periodically
   - Monitor query performance with Supabase insights

### Monitoring

**Key Metrics to Track**:

1. **Application Metrics**:

   - Heartbeat rate per nickname
   - Push notification success rate
   - API response times (p50, p95, p99)
   - Error rates (4xx, 5xx)

2. **Database Metrics**:

   - Connection pool usage
   - Query performance
   - Table sizes

3. **Infrastructure Metrics**:
   - CPU usage
   - Memory usage
   - Disk usage
   - Network I/O

**Monitoring Tools**:

**Vercel Analytics** (built-in):

- Go to Vercel project dashboard
- Navigate to Analytics tab
- View metrics and performance data

**Supabase Dashboard**:

- Database insights
- Query performance
- Storage usage

**External Monitoring** (optional):

- Datadog, New Relic, or similar
- Uptime monitoring (Pingdom, UptimeRobot)
- Error tracking (Sentry)

### Backup Strategy

**Supabase Backup**:

- Supabase provides automated backups (paid plans)
- Enable point-in-time recovery for critical data
- Export database regularly:
  ```bash
  # Via Supabase CLI
  supabase db dump -f backup.sql
  ```

**Configuration Backup**:

- Version control all configuration files
- Document all environment variables
- Keep secure backup of secrets (password manager)

## Monitoring and Maintenance

### Health Checks

**Endpoint Health Check**:

```bash
# Check if server is responding
curl https://your-server.com/api/heartbeat

# Expected: 401 Unauthorized (without auth token)
# This indicates server is running
```

**Database Connection**:

```bash
# Via Supabase Dashboard
# Go to Database → Logs
# Check for connection errors
```

### Log Management

**Vercel Logs**:

- Deployments → Latest Deployment → Function Logs
- Real-time log streaming
- 7-day retention (free tier)

**Self-Hosted Logs**:

```bash
# PM2 logs
pm2 logs mapleting

# System logs (journalctl)
journalctl -u mapleting -f

# Nginx logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

### Regular Maintenance Tasks

**Daily**:

- Monitor error rates
- Check push notification delivery success
- Verify database connection

**Weekly**:

- Review and clean up expired subscriptions
- Check disk usage and database size
- Review security logs

**Monthly**:

- Test backup restoration
- Review and update dependencies
- Performance optimization review

**Quarterly**:

- Security audit
- VAPID key rotation (optional)
- Capacity planning review

## Troubleshooting

### Deployment Issues

**Problem**: Vercel deployment fails

**Solutions**:

1. Check build logs in Vercel dashboard
2. Verify all dependencies are in `package.json`
3. Ensure Node.js version matches `.nvmrc`
4. Try local build: `bun run build`

**Problem**: Environment variables not loading

**Solutions**:

1. Verify variable names match exactly (case-sensitive)
2. Redeploy after adding variables
3. Check Vercel dashboard → Settings → Environment Variables
4. Ensure no trailing spaces in values

**Problem**: Database connection errors

**Solutions**:

1. Verify Supabase project is not paused
2. Check `NEXT_PUBLIC_SUPABASE_URL` is correct
3. Verify API keys are current
4. Check Supabase status page: [status.supabase.com](https://status.supabase.com)

### Runtime Issues

**Problem**: Push notifications not delivered

**Solutions**:

1. Verify VAPID keys are correctly set
2. Check browser console for errors
3. Test push notification with web-push library
4. Verify service worker is registered

**Problem**: High latency on API endpoints

**Solutions**:

1. Check database query performance (Supabase insights)
2. Verify indexes are created
3. Consider caching nickname resolution
4. Check Vercel function logs for slow queries

**Problem**: Service worker not registering

**Solutions**:

1. Verify HTTPS is enabled (required for service workers)
2. Check `public/sw.js` exists and is accessible
3. Clear browser cache and service workers
4. Check browser console for errors

### Client Issues

**Problem**: Client cannot connect to server

**Solutions**:

1. Verify `server_url` in client config
2. Check server is running and accessible
3. Verify network connectivity
4. Check firewall rules

**Problem**: Authentication failures (401)

**Solutions**:

1. Verify secret matches server configuration
2. Check `Authorization` header format
3. Ensure nickname exists in database
4. Check server logs for details

## Support and Resources

- **Server Documentation**: [`server/README.md`](server/README.md:1)
- **Client Documentation**: [`client/README.md`](client/README.md:1)
- **API Reference**: [`server/API.md`](server/API.md:1)
- **Supabase Docs**: [supabase.com/docs](https://supabase.com/docs)
- **Vercel Docs**: [vercel.com/docs](https://vercel.com/docs)
- **Next.js Docs**: [nextjs.org/docs](https://nextjs.org/docs)

---

**Deployment Checklist**:

- [ ] Supabase project created
- [ ] Database schema executed
- [ ] Supabase credentials obtained
- [ ] VAPID keys generated
- [ ] Server deployed (Vercel or self-hosted)
- [ ] Environment variables configured
- [ ] Custom domain configured (optional)
- [ ] SSL certificate installed (required for Web Push)
- [ ] PWA functionality tested
- [ ] Push notifications tested
- [ ] Client executables built
- [ ] Client distributed to users
- [ ] Monitoring and logging configured
- [ ] Backup strategy implemented

You're now ready to use MapleTing in production! 🚀

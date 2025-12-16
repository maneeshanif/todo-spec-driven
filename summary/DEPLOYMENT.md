# Deployment Guide

This guide covers deploying the Todo Web Application to production using Vercel (frontend) and Neon (database).

## Prerequisites

- GitHub account (for code hosting)
- Vercel account (for frontend deployment)
- Neon account (for PostgreSQL database)
- Domain name (optional, for custom domains)

---

## Database Deployment (Neon PostgreSQL)

### 1. Create Neon Project

1. Go to [Neon Console](https://console.neon.tech/)
2. Click "Create Project"
3. Choose a project name: `todo-web-app`
4. Select region closest to your users
5. PostgreSQL version: 16 (recommended)

### 2. Get Database Credentials

After project creation, Neon provides two connection strings:

```env
# Pooled connection (for serverless - FastAPI)
DATABASE_URL=postgresql://user:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require

# Direct connection (for migrations - Alembic)
DATABASE_URL_DIRECT=postgresql://user:password@ep-xxx.region.aws.neon.tech:5432/neondb?sslmode=require
```

### 3. Run Database Migrations

```bash
cd backend

# Set environment variables
export DATABASE_URL="<your-neon-direct-url>"

# Run migrations
uv run alembic upgrade head

# Verify migration
uv run alembic current
```

### 4. Configure Connection Pooling

Neon automatically handles connection pooling for serverless environments. No additional configuration needed.

---

## Backend Deployment

### Option 1: Docker Container (Recommended)

The backend includes a Dockerfile for containerized deployment.

#### Build and Push Docker Image

```bash
cd backend

# Build image
docker build -t todo-web-app-backend:latest .

# Tag for registry (example: Docker Hub)
docker tag todo-web-app-backend:latest yourusername/todo-web-app-backend:latest

# Push to registry
docker push yourusername/todo-web-app-backend:latest
```

#### Deploy to Cloud Provider

**Railway:**
1. Go to [Railway](https://railway.app/)
2. New Project → Deploy from Docker Image
3. Enter your Docker image: `yourusername/todo-web-app-backend:latest`
4. Add environment variables (see below)
5. Deploy!

**Render:**
1. Go to [Render](https://render.com/)
2. New → Web Service
3. Connect Docker image
4. Add environment variables
5. Deploy

**Fly.io:**
```bash
# Install flyctl
curl -L https://fly.io/install.sh | sh

# Login
fly auth login

# Launch app
cd backend
fly launch

# Set environment variables
fly secrets set DATABASE_URL="<neon-url>"
fly secrets set JWT_SECRET_KEY="<your-secret>"

# Deploy
fly deploy
```

### Option 2: Serverless (FastAPI on AWS Lambda)

Use [Mangum](https://mangum.io/) adapter for AWS Lambda deployment.

```bash
pip install mangum

# In src/main.py, add:
from mangum import Mangum
handler = Mangum(app)
```

Deploy using AWS SAM, Serverless Framework, or Zappa.

### Backend Environment Variables

Required environment variables for production:

```env
# Database
DATABASE_URL=<neon-pooled-connection-string>
DATABASE_URL_DIRECT=<neon-direct-connection-string>

# JWT Authentication
JWT_SECRET_KEY=<generate-with-openssl-rand-base64-32>
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=10080  # 7 days

# CORS
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Optional: Monitoring
SENTRY_DSN=<your-sentry-dsn>
```

#### Generate JWT Secret

```bash
openssl rand -base64 32
```

---

## Frontend Deployment (Vercel)

### 1. Push Code to GitHub

```bash
# Initialize git (if not already)
git init
git add .
git commit -m "Initial commit"

# Create GitHub repository
# Then push code
git remote add origin https://github.com/yourusername/todo-web-app.git
git branch -M main
git push -u origin main
```

### 2. Deploy to Vercel

#### Method 1: Vercel Dashboard

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository
4. Configure:
   - **Framework Preset**: Next.js
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
5. Add Environment Variables (see below)
6. Click "Deploy"

#### Method 2: Vercel CLI

```bash
cd frontend

# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Deploy to production
vercel --prod
```

### Frontend Environment Variables

Add these in Vercel Dashboard → Project Settings → Environment Variables:

```env
# Backend API URL
NEXT_PUBLIC_API_URL=https://your-backend-url.com

# Optional: Analytics
NEXT_PUBLIC_ANALYTICS_ID=<your-analytics-id>
```

### 3. Custom Domain Setup

1. Go to Vercel Dashboard → Your Project → Settings → Domains
2. Add your custom domain
3. Update DNS records as instructed by Vercel:
   - Type: `A` or `CNAME`
   - Name: `@` or `www`
   - Value: Vercel's provided value
4. Wait for DNS propagation (5-60 minutes)

---

## Environment Variables Summary

### Backend (.env)

```env
# Required
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
DATABASE_URL_DIRECT=postgresql://user:pass@host:5432/db?sslmode=require
JWT_SECRET_KEY=<32-char-random-string>
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=10080

# Production
CORS_ORIGINS=https://yourdomain.com

# Optional
SENTRY_DSN=
LOG_LEVEL=INFO
```

### Frontend (.env.local)

```env
# Required
NEXT_PUBLIC_API_URL=https://api.yourdomain.com

# Optional
NEXT_PUBLIC_ANALYTICS_ID=
```

---

## Post-Deployment Checklist

### Backend

- [ ] Database migrations applied (`alembic upgrade head`)
- [ ] Health check endpoint responds: `GET /api/health`
- [ ] API docs accessible: `/docs`
- [ ] CORS configured for frontend domain
- [ ] JWT secret is strong and secret
- [ ] HTTPS enforced
- [ ] Error tracking setup (Sentry, etc.)
- [ ] Logs configured for production

### Frontend

- [ ] Environment variables set correctly
- [ ] Backend API connection working
- [ ] All pages load without errors
- [ ] Authentication flow works
- [ ] Task CRUD operations functional
- [ ] Mobile responsive
- [ ] PWA manifest configured
- [ ] Analytics tracking (if enabled)

### Security

- [ ] HTTPS enforced on all endpoints
- [ ] JWT tokens expire correctly
- [ ] Passwords hashed with bcrypt
- [ ] SQL injection prevention (SQLModel ORM)
- [ ] Rate limiting on auth endpoints
- [ ] CORS restricted to frontend domain
- [ ] No secrets in client-side code
- [ ] Environment variables not committed to git

---

## Monitoring and Maintenance

### Health Checks

```bash
# Backend health
curl https://api.yourdomain.com/api/health

# Frontend
curl https://yourdomain.com/
```

### Database Backups

Neon provides automatic backups. To create manual backup:

1. Go to Neon Console → Your Project → Backups
2. Click "Create Backup"
3. Download backup file

### Logs

**Vercel Logs** (Frontend):
```bash
vercel logs <deployment-url>
```

**Backend Logs**:
- Railway: Dashboard → Deployments → View Logs
- Render: Dashboard → Logs
- Fly.io: `fly logs`

### Rollback

**Vercel** (Frontend):
1. Dashboard → Deployments
2. Find previous deployment
3. Click "..." → Promote to Production

**Backend**:
- Railway/Render: Redeploy previous version from dashboard
- Fly.io: `fly releases` → `fly releases rollback <version>`
- Docker: Deploy previous image tag

---

## Troubleshooting

### Common Issues

**Frontend can't connect to backend:**
- Verify `NEXT_PUBLIC_API_URL` is correct
- Check CORS settings in backend
- Verify backend is deployed and accessible

**Database connection fails:**
- Verify `DATABASE_URL` has `?sslmode=require`
- Check Neon project is active (not suspended)
- Verify connection pooling settings

**JWT authentication errors:**
- Verify `JWT_SECRET_KEY` matches between backend instances
- Check token expiration settings
- Clear browser localStorage and re-login

**Build failures:**
- Check all dependencies in package.json/pyproject.toml
- Verify Node.js/Python versions match local environment
- Review build logs for specific errors

---

## Cost Estimation

### Free Tier (Development/Testing)

- **Vercel**: Free tier includes 100GB bandwidth/month
- **Neon**: Free tier includes 0.5GB storage, 3GB data transfer
- **Total**: $0/month for small projects

### Production (Moderate Traffic)

- **Vercel Pro**: $20/month (unlimited bandwidth)
- **Neon Pro**: $19/month (3GB storage, 50GB transfer)
- **Backend Hosting** (Railway/Render): $5-20/month
- **Total**: ~$45-60/month

### Scale (High Traffic)

- **Vercel Enterprise**: Custom pricing
- **Neon Scale**: $69/month (10GB storage, 250GB transfer)
- **Backend Scaling**: Auto-scaling containers ($50-200/month)
- **Total**: $150-300/month+

---

## Support

For deployment issues:
- **Vercel**: https://vercel.com/support
- **Neon**: https://neon.tech/docs/introduction
- **Backend Platforms**: Check respective documentation

---

## Next Steps

After successful deployment:

1. **Set up monitoring** - Configure uptime monitoring (UptimeRobot, Pingdom)
2. **Enable analytics** - Add Google Analytics or Plausible
3. **Configure backups** - Set up automated database backups
4. **SSL certificates** - Verify HTTPS is working
5. **Performance testing** - Run load tests to verify scalability
6. **User feedback** - Gather feedback and iterate

**Production Ready! 🚀**

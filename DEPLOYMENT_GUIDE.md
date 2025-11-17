# QuickOrder - Deployment Guide

## Pre-Deployment Checklist

### ✅ Security Review
- [x] `.env` file added to `.gitignore`
- [x] `.env.example` created with template variables
- [x] Sensitive data not committed to repository
- [x] JWT secret is strong and random
- [x] CORS properly configured
- [x] Rate limiting enabled
- [x] Helmet security headers enabled

### ✅ Code Quality
- [x] Code follows consistent style
- [x] Error handling implemented
- [x] Logging configured
- [x] Database models validated
- [x] API endpoints documented

### ✅ Features Implemented
- [x] User authentication (JWT)
- [x] Order management system
- [x] Inventory management
- [x] Email notifications (SendGrid)
- [x] Payment status tracking
- [x] Admin/Owner dashboard
- [x] File upload functionality

---

## Deployment Options

### Option 1: Deploy to Heroku (Easiest for Beginners)

**Prerequisites:**
- Heroku account (https://heroku.com)
- Heroku CLI installed
- Git repository ready

**Steps:**

1. **Create Heroku app:**
   ```bash
   heroku login
   heroku create your-app-name
   ```

2. **Set environment variables:**
   ```bash
   heroku config:set MONGO_URI=your_mongodb_uri
   heroku config:set JWT_SECRET=your-secure-random-secret
   heroku config:set SENDGRID_API_KEY=your_sendgrid_key
   heroku config:set EMAIL_FROM=your-email@quickorder.com
   heroku config:set NODE_ENV=production
   ```

3. **Deploy:**
   ```bash
   git push heroku main
   ```

4. **Monitor:**
   ```bash
   heroku logs --tail
   ```

**Pros:** Simple, free tier available, automatic scaling
**Cons:** Can be expensive at scale

---

### Option 2: Deploy to AWS (Most Scalable)

**Using Elastic Beanstalk:**

1. **Install EB CLI:**
   ```bash
   pip install awsebcli
   ```

2. **Initialize Elastic Beanstalk:**
   ```bash
   eb init -p node.js-18 quickorder
   ```

3. **Create environment:**
   ```bash
   eb create quickorder-env
   ```

4. **Set environment variables:**
   ```bash
   eb setenv MONGO_URI=your_mongodb_uri JWT_SECRET=your_secret ...
   ```

5. **Deploy:**
   ```bash
   eb deploy
   ```

**Pros:** Highly scalable, professional, excellent support
**Cons:** More complex setup, pay-as-you-go pricing

---

### Option 3: Deploy to DigitalOcean (Recommended for Cost)

**Using App Platform:**

1. **Push to GitHub:**
   ```bash
   git push origin main
   ```

2. **Create DigitalOcean account** and connect GitHub

3. **Create new App:**
   - Select repository
   - Select `main` branch
   - Choose pricing plan ($5-12/month)

4. **Set environment variables** in DO console:
   - MONGO_URI
   - JWT_SECRET
   - SENDGRID_API_KEY
   - etc.

5. **Deploy** - DO handles automatically on every push

**Pros:** Affordable, easy setup, good documentation
**Cons:** Less features than AWS

---

### Option 4: Deploy to Railway (Modern Alternative)

1. **Sign up at https://railway.app**
2. **Connect GitHub repository**
3. **Set environment variables**
4. **Deploy** - automatic on every push
5. **Pay only for what you use**

**Pros:** Simple, modern UI, affordable
**Cons:** Relatively new platform

---

## Production Environment Setup

### Database (MongoDB Atlas)
1. Create account at https://mongodb.com/cloud/atlas
2. Create cluster
3. Create database user
4. Whitelist IP addresses
5. Copy connection string to `MONGO_URI`

### Email (SendGrid)
1. Create account at https://sendgrid.com
2. Create API key
3. Verify sender email
4. Add `SENDGRID_API_KEY` to environment

### Environment Variables (Production)
```env
NODE_ENV=production
PORT=5001
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/db
JWT_SECRET=<strong-random-secret-64-chars>
JWT_EXPIRES_IN=24h
SENDGRID_API_KEY=SG.<your-key>
EMAIL_FROM=noreply@quickorder.com
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

---

## Docker Deployment

### Build Docker Image
```bash
docker build -t quickorder:latest .
```

### Run Locally
```bash
docker run -p 5001:5001 \
  -e MONGO_URI="your_mongodb_uri" \
  -e JWT_SECRET="your_secret" \
  quickorder:latest
```

### Deploy to Docker Hub
```bash
docker tag quickorder:latest username/quickorder:latest
docker login
docker push username/quickorder:latest
```

---

## Performance Optimization for Production

1. **Enable Compression:**
   ```javascript
   app.use(compression());
   ```

2. **Use Connection Pooling:**
   - MongoDB: Already configured in Mongoose

3. **Implement Caching:**
   - Consider Redis for session management
   - Cache frequently accessed data

4. **Database Indexing:**
   - Add indexes to frequently queried fields
   - Monitor slow queries

5. **Load Balancing:**
   - Configure multiple instances
   - Use reverse proxy (Nginx)

---

## Monitoring & Logging

### Recommended Tools
1. **Sentry** - Error tracking
2. **LogRocket** - Session replay
3. **DataDog** - Performance monitoring
4. **New Relic** - APM monitoring

### Application Logging
Logs are already configured in `src/utils/logger.js`

---

## SSL/HTTPS

### For most hosting platforms (Heroku, DigitalOcean, etc.):
- SSL automatically provided
- Automatic certificate renewal
- Enable HTTPS enforcement in app

### For custom domains:
- Use Let's Encrypt (free SSL)
- Or purchase SSL certificate
- Update DNS records

---

## Post-Deployment Checklist

- [ ] Verify database connection
- [ ] Test email notifications
- [ ] Check authentication flow
- [ ] Verify file uploads working
- [ ] Monitor error logs
- [ ] Set up automated backups
- [ ] Configure DNS and domain
- [ ] Set up SSL certificate
- [ ] Configure CDN for static assets
- [ ] Set up monitoring alerts

---

## Scaling Considerations

### Horizontal Scaling:
- Deploy multiple instances
- Use load balancer
- Ensure stateless architecture ✓

### Database Scaling:
- MongoDB replication
- Implement read replicas
- Consider database sharding

### Caching Layer:
- Implement Redis
- Cache order data
- Session storage

---

## Rollback Procedure

### If deployment fails:

**For Heroku:**
```bash
heroku releases
heroku rollback v<number>
```

**For DigitalOcean:**
- Redeploy previous commit
- Use GitHub release tags

**For Docker:**
```bash
docker run -p 5001:5001 quickorder:previous-tag
```

---

## Contact & Support

For deployment issues:
1. Check logs: `npm run logs`
2. Verify environment variables
3. Test database connection
4. Review error handling documentation

---

**Last Updated:** November 17, 2025
**Status:** Ready for Production Deployment

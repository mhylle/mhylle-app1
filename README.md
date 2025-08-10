# App1 - Demo Application

Demo application for the mhylle.com infrastructure showcasing independent deployment capabilities.

## 🏗️ Architecture

- **Frontend**: Angular 19+ SPA with subpath routing support
- **Backend**: NestJS 11+ API with PostgreSQL integration
- **Database**: Dedicated PostgreSQL database (app1_db)
- **Deployment**: Docker containers via GitHub Actions

## 🚀 Quick Start

### Local Development

1. **Clone the repository**:
   ```bash
   git clone <your-app1-repo>
   cd app1
   ```

2. **Start development environment**:
   ```bash
   docker-compose -f docker-compose.dev.yml up -d
   ```

3. **Access the application**:
   - Frontend: http://localhost:4200
   - Backend API: http://localhost:3000
   - Full stack via Nginx: http://localhost:8080/app1

### Production Deployment

Deployment is automated via GitHub Actions when you push to the `main` branch.

1. **Configure GitHub Secrets**:
   ```
   SERVER_HOST=51.159.168.239
   SERVER_USER=mhylle
   SERVER_SSH_KEY=<your-private-ssh-key>
   ```

2. **Push to main branch**:
   ```bash
   git push origin main
   ```

3. **Monitor deployment**:
   - Check GitHub Actions tab for deployment status
   - Access at: https://mhylle.com/app1

## 📁 Project Structure

```
app1/
├── frontend/                   # Angular application
│   ├── src/
│   │   ├── app/
│   │   │   ├── pages/         # Page components
│   │   │   ├── app.component.ts
│   │   │   └── app.routes.ts
│   │   └── index.html
│   ├── Dockerfile            # Production build
│   ├── Dockerfile.dev        # Development build
│   ├── nginx.conf           # Frontend Nginx config
│   ├── angular.json         # Angular configuration
│   └── package.json
├── backend/                   # NestJS API
│   ├── src/
│   │   ├── config/           # Configuration modules
│   │   ├── modules/          # Feature modules
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── Dockerfile           # Production build
│   ├── Dockerfile.dev       # Development build
│   └── package.json
├── .github/workflows/        # CI/CD pipelines
│   └── deploy.yml
├── docker-compose.dev.yml    # Development environment
└── README.md
```

## 🔧 Development

### Frontend Development

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run start

# Build for production
npm run build:prod

# Run tests
npm run test

# Lint code
npm run lint
```

### Backend Development

```bash
cd backend

# Install dependencies
npm install

# Start development server
npm run start:dev

# Build for production
npm run build

# Run tests
npm run test

# Lint code
npm run lint
```

## 🐳 Docker Configuration

### Frontend Dockerfile Features

- **Multi-stage build**: Separate build and runtime stages
- **Base-href support**: Configurable for subpath deployment
- **Nginx optimization**: Gzip, caching, security headers
- **Health checks**: Container health monitoring
- **Non-root user**: Security best practices

### Backend Dockerfile Features

- **Multi-stage build**: Optimized production image
- **API prefix support**: Configurable routing prefix
- **Health endpoint**: Monitoring and status checks
- **Security middleware**: Helmet, CORS, rate limiting
- **Signal handling**: Proper container shutdown

## 🔄 CI/CD Pipeline

The deployment pipeline includes:

1. **Test Phase**:
   - Frontend linting and testing
   - Backend linting and testing
   - Code quality checks

2. **Build Phase**:
   - Multi-platform Docker image builds
   - Version tagging and metadata
   - Push to GitHub Container Registry

3. **Deploy Phase**:
   - SSH deployment to Scaleway server
   - Zero-downtime deployment strategy
   - Database migration (if needed)
   - Health verification

4. **Verify Phase**:
   - Container status checks
   - Health endpoint testing
   - Application accessibility

## 🌐 Deployment Configuration

### Environment Variables

The application supports these environment variables:

**Frontend**:
- `BASE_HREF`: Base path for Angular router (e.g., `/app1/`)
- `DEPLOY_URL`: Asset deployment URL

**Backend**:
- `NODE_ENV`: Environment (development/production)
- `PORT`: Server port (default: 3000)
- `API_PREFIX`: API path prefix (e.g., `/api/app1`)
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`: Database config

### Subpath Routing

The application is configured for subpath deployment:

- **Frontend**: Angular router with custom base-href
- **Backend**: Configurable API prefix
- **Assets**: Proper asset path resolution
- **CORS**: Configured for production domain

## 📊 Monitoring

### Health Checks

- **Backend Health**: `/health` endpoint with system status
- **Frontend Health**: Nginx health check on port 80
- **Database Health**: PostgreSQL connection verification

### Logging

- **Container Logs**: Available via infrastructure log scripts
- **Application Logs**: Structured logging to stdout/stderr
- **Access Logs**: Nginx request logging

### Metrics

The health endpoint provides:
- System uptime
- Memory usage
- Database response time
- Application version
- Environment information

## 🔐 Security

### Frontend Security

- **CSP Headers**: Content Security Policy
- **XSS Protection**: Cross-site scripting prevention
- **CORS**: Configured for production domain
- **Asset Integrity**: SRI for critical resources

### Backend Security

- **Helmet**: Security headers middleware
- **Rate Limiting**: API request throttling
- **Input Validation**: Request payload validation
- **CORS**: Cross-origin request handling
- **SQL Injection**: TypeORM query protection

## 🧪 Testing

### Frontend Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run e2e

# Coverage report
npm run test:coverage
```

### Backend Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Coverage report
npm run test:cov
```

## 📚 API Documentation

When running in development mode, API documentation is available at:
- http://localhost:3000/docs (Swagger UI)

### Key Endpoints

- `GET /health` - System health check
- `GET /api/app1` - API root
- `GET /api/app1/version` - Version information

## 🛠️ Troubleshooting

### Common Issues

**Build Failures**:
```bash
# Check Docker build logs
docker build -t app1-frontend ./frontend
docker build -t app1-backend ./backend
```

**Development Environment**:
```bash
# Reset development environment
docker-compose -f docker-compose.dev.yml down -v
docker-compose -f docker-compose.dev.yml up -d --build
```

**Database Issues**:
```bash
# Check database logs
docker-compose -f docker-compose.dev.yml logs postgres

# Reset database
docker-compose -f docker-compose.dev.yml down -v postgres
```

### Debugging

**Frontend Debugging**:
- Check browser console for errors
- Verify API endpoints in Network tab
- Check routing configuration

**Backend Debugging**:
- Check server logs for errors
- Verify database connection
- Test API endpoints directly

## 🔄 Updates

### Updating Dependencies

**Frontend**:
```bash
cd frontend
npm update
npm audit fix
```

**Backend**:
```bash
cd backend
npm update
npm audit fix
```

### Version Management

Versions are automatically generated during deployment:
- Format: `v{YYYYMMDD}-{git-sha}`
- Tags: `latest`, version, branch name
- Stored in deployment logs

## 📞 Support

For issues related to:
- **Application bugs**: Create GitHub issue
- **Infrastructure**: Check main infrastructure repository
- **Deployment**: Review GitHub Actions logs
- **Database**: Check PostgreSQL logs via infrastructure scripts

---

**Application Version**: 1.0.0  
**Last Updated**: $(date)  
**Infrastructure**: mhylle.com  
**Deployment URL**: https://mhylle.com/app1
# Deployment triggered at Sun Aug 10 13:01:13 CEST 2025

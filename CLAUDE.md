# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is **App1** - an example Angular/NestJS application deployed to mhylle.com infrastructure with subpath routing. It demonstrates the standard application structure for the multi-app hosting platform.

## Application Stack

- **Frontend**: Angular 20 with standalone components and subpath routing (`/app1/`)
- **Backend**: NestJS 11 with TypeORM and PostgreSQL integration
- **Database**: PostgreSQL 15 (shared instance with dedicated `app1_db` database)
- **Deployment**: GitHub Actions → GitHub Container Registry → Docker containers

## Common Development Commands

### Frontend (Angular 20)
```bash
cd frontend

# Development
npm start                    # Start dev server with proxy config (port 4200)
npm run start:prod          # Start without proxy (direct to port 4200)
npm run build               # Build for production
ng build --base-href=/app1/ # Build with correct subpath routing (CRITICAL)

# Testing
npm test                    # Run unit tests with Karma
ng test --no-watch --no-progress --browsers=ChromeHeadless # CI mode

# Code Quality
ng lint                     # Run ESLint (if configured)
```

### Backend (NestJS 11)
```bash
cd backend

# Development
npm run start:dev           # Start with hot-reload on port 3000
npm run start:debug         # Start with debugging enabled
npm run start:prod          # Start production server

# Testing
npm test                    # Run unit tests with Jest
npm run test:watch          # Watch mode for development
npm run test:cov           # Generate coverage report
npm run test:e2e           # Run end-to-end tests

# Code Quality
npm run lint               # Run ESLint
npm run format             # Format with Prettier
```

### Docker Development
```bash
# Local development with Docker
docker-compose -f docker-compose.dev.yml up -d     # Start all services
docker-compose -f docker-compose.dev.yml logs -f   # View logs
docker-compose -f docker-compose.dev.yml down      # Stop services
docker-compose -f docker-compose.dev.yml down -v   # Stop and clean volumes

# Access points:
# Frontend: http://localhost:4200 (with proxy to backend)
# Backend: http://localhost:3000 (direct access)
# Full stack via nginx: http://localhost:8080/app1
```

## Architecture

### Directory Structure
```
example-app1/
├── frontend/                   # Angular 20 application
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/    # Reusable components
│   │   │   │   └── message-manager/
│   │   │   ├── models/        # TypeScript interfaces
│   │   │   ├── pages/         # Route components
│   │   │   │   ├── home/
│   │   │   │   └── health/
│   │   │   ├── services/      # Business logic
│   │   │   ├── app.component.ts
│   │   │   ├── app.config.ts  # Application configuration
│   │   │   └── app.routes.ts  # Route definitions
│   │   └── index.html
│   ├── Dockerfile             # Production container
│   ├── nginx.conf            # Frontend nginx config (handles SPA routing)
│   └── angular.json          # Angular configuration
├── backend/                   # NestJS 11 API
│   ├── src/
│   │   ├── config/           # Configuration modules
│   │   │   └── database.config.ts
│   │   ├── app.module.ts     # Root module
│   │   ├── app.controller.ts # Root controller
│   │   ├── app.service.ts    # Root service
│   │   ├── message.entity.ts # TypeORM entities
│   │   └── main.ts           # Application bootstrap
│   ├── Dockerfile            # Production container
│   └── package.json
├── docker-compose.yml        # Production services
├── docker-compose.dev.yml    # Development environment
└── .github/workflows/deploy.yml # CI/CD pipeline
```

### Key Architectural Patterns

1. **Subpath Routing**: 
   - Frontend served at `/app1/` (not root)
   - API served at `/api/app1/`
   - Nginx strips `/api/app1` prefix before forwarding to backend

2. **Standalone Angular Components**:
   - All components use standalone: true
   - No NgModules except for legacy dependencies
   - Direct imports in components

3. **Database Configuration**:
   - TypeORM with PostgreSQL
   - Database: `app1_db`
   - Connection via environment variables

4. **Container Architecture**:
   - Separate containers for frontend and backend
   - Shared PostgreSQL instance
   - Internal Docker network (`mhylle_app-network`)

## Critical Configuration Points

### Frontend Development Proxy
The frontend uses a proxy configuration (`proxy.conf.json`) for local development:
```json
{
  "/api/app1/*": {
    "target": "http://localhost:3000",
    "pathRewrite": { "^/api/app1": "" }
  }
}
```
This allows `/api/app1/*` requests to be proxied to the backend during development.

### Frontend Base HREF
The Angular application MUST be built with the correct base-href:
```bash
ng build --base-href=/app1/
```
This is configured in the Dockerfile build args.

### Backend API Prefix
The NestJS backend does NOT use a global prefix. The nginx proxy handles path rewriting:
```nginx
location /api/app1/ {
    rewrite ^/api/app1/(.*)$ /$1 break;  # Strips prefix
    proxy_pass http://app1-backend:3000;
}
```

### CORS Configuration
Backend CORS is configured in `main.ts`:
- Production: Allows specific origins (mhylle.com)
- Development: Allows all origins

### Health Endpoints
- Backend: `/health` - Returns system status JSON
- Frontend: nginx `/health` endpoint
Both are required for Docker health checks.

## Deployment Process

### GitHub Actions Workflow
1. **Test Phase**: Validates Dockerfiles and configuration
2. **Build Phase**: 
   - Builds multi-platform Docker images
   - Pushes to GitHub Container Registry
   - Tags with version and 'latest'
3. **Deploy Phase** (main branch only):
   - SSH to server
   - Pulls new images
   - Stops old containers (app1 only)
   - Starts new containers
   - Verifies deployment
4. **Verify Phase**: Health checks and accessibility tests

### Environment Variables
```bash
# Backend
NODE_ENV=production
DB_HOST=mhylle-postgres     # Container name, not localhost
DB_PORT=5432
DB_NAME=app1_db
DB_USER=app1_user
DB_PASSWORD=${APP1_DB_PASSWORD}
API_PREFIX=/api/app1         # For routing context

# Frontend
BASE_HREF=/app1/
DEPLOY_URL=/app1/
```

## Common Issues & Solutions

### Frontend Not Loading
- Verify base-href is `/app1/` not `/`
- Check nginx.conf handles both `/` and `/app1/` locations
- Ensure index.html has correct base tag

### API 404 Errors
- Backend should NOT have global prefix set
- Nginx must strip `/api/app1` prefix
- Health endpoint must be at root `/health`

### Database Connection Failed
- Use hostname `mhylle-postgres` not `localhost` or `postgres`
- Ensure container is on `mhylle_app-network`
- Database name is `app1_db` not `mhylle_app1`

### CORS Issues
- Backend CORS must include production domain
- Frontend API calls should use relative paths or full URLs

### Container Health Checks Failing
- Backend must respond to `/health` with 200 status
- Frontend nginx must serve static files
- Allow sufficient start_period (30-40s)

## Testing Strategy

### Local Testing
```bash
# Test backend API directly
curl http://localhost:3000/health

# Test with frontend proxy (when frontend dev server is running)
curl http://localhost:4200/api/app1/health

# Test frontend build
cd frontend && npm run build -- --base-href=/app1/

# Test Docker build
docker build -f frontend/Dockerfile -t test-frontend .
docker build -f backend/Dockerfile -t test-backend .
```

### Production Verification
```bash
# After deployment
curl https://mhylle.com/app1/
curl https://mhylle.com/api/app1/health
```

## Adding New Features

When adding new features:
1. Follow Angular standalone component pattern
2. Add TypeScript interfaces in `models/`
3. Create services in `services/`
4. Add route components in `pages/`
5. Update `app.routes.ts` for new routes
6. Ensure API endpoints work without `/api/app1` prefix
7. Add health check data if creating monitoring features

## Security Considerations

- Never commit secrets to repository
- Use GitHub Secrets for sensitive data
- Backend validates all inputs
- TypeORM prevents SQL injection
- Nginx adds security headers
- Containers run as non-root when possible

## Performance Notes

- Angular production build includes:
  - Tree shaking
  - Minification
  - Ahead-of-time compilation
- Nginx caches static assets with 1-year expiry
- Gzip compression enabled
- Database uses connection pooling
- Container health checks prevent unhealthy instances from receiving traffic
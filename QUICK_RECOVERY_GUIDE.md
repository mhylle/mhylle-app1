# Quick Recovery Guide - Authentication System

## 🚀 Immediate Fix Needed

**Problem**: Frontend making auth requests to wrong URL
```
❌ Current: http://localhost:4200/api/auth/login (404 Not Found)
✅ Should be: http://localhost:8081/api/auth/login (working via nginx)
```

## 🔧 Quick Fix Options

### Option 1: Update Auth Service URL (Recommended - 2 minutes)
```typescript
// File: /frontend/src/app/services/auth.service.ts
// Find the API URL and change it to use nginx proxy:

// Change from:
private apiUrl = '/api/auth';

// Change to:
private apiUrl = 'http://localhost:8081/api/auth';
```

### Option 2: Environment-Based URL (Better long-term)
```typescript
// File: /frontend/src/app/services/auth.service.ts
// Use environment variable:

import { environment } from '../environments/environment';

private apiUrl = environment.production 
  ? '/api/auth'  // Production uses same-origin
  : 'http://localhost:8081/api/auth';  // Development uses nginx proxy
```

## 🧪 Test Commands

### 1. Verify Auth Service Working:
```bash
curl -X POST http://localhost:8081/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@mhylle.com","password":"Admin123!"}'
```
**Expected**: `{"success":true,"data":{"id":"d104f50a..."`

### 2. Check Container Status:
```bash
cd /home/mhylle/projects/mhylle.com/example-app1
docker-compose -f docker-compose.dev.yml ps
```
**Expected**: All containers "Up"

### 3. Test Frontend:
```bash
# Navigate to: http://localhost:4200/candy-factory
# Click "🔑 Login to Save Progress"
# Click "Login" in modal
# Should now work without 404 error
```

## 🐳 Container Recovery

### If containers are down:
```bash
cd /home/mhylle/projects/mhylle.com/example-app1
docker-compose -f docker-compose.dev.yml up -d
```

### If auth-service has issues:
```bash
docker-compose -f docker-compose.dev.yml restart auth-service
docker logs auth-service-dev --tail 20
```

## 📍 Key File Locations

1. **Auth Service Code**: `/home/mhylle/projects/mhylle.com/auth-service/`
2. **Frontend Auth Service**: `/home/mhylle/projects/mhylle.com/example-app1/frontend/src/app/services/auth.service.ts`
3. **Nginx Config**: `/home/mhylle/projects/mhylle.com/example-app1/nginx.dev.conf`
4. **Docker Compose**: `/home/mhylle/projects/mhylle.com/example-app1/docker-compose.dev.yml`

## 🎯 Success Indicators

After fix:
- ✅ Login modal appears on button click
- ✅ Login button click shows success (no 404 error)
- ✅ User sees welcome message with name
- ✅ Login button changes to sync/logout buttons
- ✅ Game state can be saved to database

## 🔍 Debugging

### Check Auth Service:
```bash
docker logs auth-service-dev --tail 50
```

### Check Frontend Logs:
```bash
docker logs app1-frontend-dev --tail 50
```

### Check Nginx Logs:
```bash
docker logs app1-nginx-dev --tail 50
```

### Database Check:
```bash
docker exec app1-postgres-dev psql -U app1_user -d auth_db -c "SELECT email, first_name FROM users;"
```

## ⚡ Super Quick Fix (30 seconds)

1. Find `/frontend/src/app/services/auth.service.ts`
2. Change API URL to `'http://localhost:8081/api/auth'`
3. Frontend will hot-reload automatically
4. Test login button - should work immediately

---
**This system is 90% complete - just needs this one URL fix!**
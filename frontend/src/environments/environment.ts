export const environment = {
  production: false,
  apiUrl: 'http://localhost:8090/api/app1',
  // Use external auth service - matches production architecture (no local mock)
  authUrl: 'http://localhost:8090/api/auth'  // Proxied to external dev auth service
};
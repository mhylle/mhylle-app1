export const environment = {
  production: false,
  apiUrl: 'http://localhost:8090/api/app1',
  // Consistent auth through app1 backend - no direct auth service calls
  authUrl: 'http://localhost:8090/api/app1/auth'
};
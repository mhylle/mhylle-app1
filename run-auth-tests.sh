#!/bin/bash

# Authentication Test Runner for Cosmic Candy Factory
# This script sets up and runs the complete authentication test suite

set -e

echo "🍭 Cosmic Candy Factory - Authentication Test Runner"
echo "================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "playwright.config.ts" ]; then
    print_error "playwright.config.ts not found. Please run from the project root directory."
    exit 1
fi

# Install dependencies if needed
print_status "Checking dependencies..."
if [ ! -d "node_modules" ]; then
    print_status "Installing npm dependencies..."
    npm install
fi

if [ ! -f "node_modules/.bin/playwright" ]; then
    print_status "Installing Playwright..."
    npm run install:playwright
fi

# Check if services are running
print_status "Checking required services..."

# Check frontend
if curl -s http://localhost:4200/candy-factory > /dev/null; then
    print_success "Frontend service is running at localhost:4200"
else
    print_warning "Frontend service not detected at localhost:4200"
    print_warning "Please start the frontend with: cd frontend && npm run start"
fi

# Check auth service
if curl -s http://localhost:8081/api/auth/validate > /dev/null; then
    print_success "Auth service is running at localhost:8081"
else
    print_warning "Auth service not detected at localhost:8081"
    print_warning "Please ensure the auth service is running"
fi

# Run tests based on arguments
case "${1:-all}" in
    "streamlined"|"quick")
        print_status "Running streamlined authentication tests..."
        npx playwright test auth-streamlined
        ;;
    "full"|"comprehensive")
        print_status "Running comprehensive authentication tests..."
        npx playwright test auth.spec.ts
        ;;
    "ui")
        print_status "Running tests with UI..."
        npx playwright test auth --ui
        ;;
    "headed")
        print_status "Running tests in headed mode..."
        npx playwright test auth --headed
        ;;
    "debug")
        print_status "Running tests in debug mode..."
        npx playwright test auth --debug
        ;;
    "report")
        print_status "Generating and showing test report..."
        npx playwright show-report
        ;;
    "all"|*)
        print_status "Running all authentication tests..."
        npx playwright test auth
        ;;
esac

# Check test results
if [ $? -eq 0 ]; then
    print_success "All tests completed successfully! 🎉"
    print_status "View detailed report with: npm run test:report"
else
    print_error "Some tests failed. Check the output above for details."
    print_status "Debug failed tests with: npm run test:debug"
    exit 1
fi

echo ""
print_status "Test Results:"
print_status "- Screenshots: test-results/*.png"
print_status "- Videos: test-results/*.webm"
print_status "- HTML Report: playwright-report/index.html"
print_status "- View report: npm run test:report"
# Launch script for Intelligent Multilingual Document Understanding

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "Starting Intelligent Document Understanding Portal..." -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# Check if backend directory exists
if (-not (Test-Path "backend")) {
    Write-Error "Backend folder not found. Please run this script from the project root."
    Exit 1
}

# 1. Start backend in a new window
Write-Host "[1/2] Starting FastAPI backend in a new window..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; if (Test-Path '.venv') { .\.venv\Scripts\Activate.ps1 }; uvicorn app.main:app --reload"

# 2. Start frontend in a new window
Write-Host "[2/2] Starting React Vite frontend in a new window..." -ForegroundColor Yellow
if (-not (Test-Path "frontend\node_modules")) {
    Write-Host "node_modules not found in frontend directory. Installing dependencies first with pnpm..." -ForegroundColor Cyan
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; pnpm install; pnpm run dev"
} else {
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; pnpm run dev"
}

Write-Host "----------------------------------------------------------" -ForegroundColor Green
Write-Host "Services are launching!" -ForegroundColor Green
Write-Host "  - Backend API: http://127.0.0.1:8000/docs" -ForegroundColor Green
Write-Host "  - Frontend Portal: http://localhost:5173" -ForegroundColor Green
Write-Host "Please check the newly opened windows for logs." -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green

@echo off
echo ========================================
echo   Starting BloodLink Backend Server
echo ========================================
echo.

cd server

echo Checking MongoDB connection...
mongosh --eval "db.version()" > nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] MongoDB is not running!
    echo.
    echo Please start MongoDB first:
    echo   - Check Windows Services for "MongoDB"
    echo   - Or install MongoDB from: https://www.mongodb.com/try/download/community
    echo.
    pause
    exit /b 1
)

echo [OK] MongoDB is running
echo.
echo Starting backend server on http://localhost:5000
echo Press Ctrl+C to stop
echo.

npm run dev

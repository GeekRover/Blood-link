@echo off
echo ========================================
echo   Seeding BloodLink Database
echo ========================================
echo.

cd server

echo Checking MongoDB connection...
mongosh --eval "db.version()" > nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] MongoDB is not running!
    echo.
    echo Please start MongoDB first.
    pause
    exit /b 1
)

echo [OK] MongoDB is running
echo.
echo This will:
echo   - Clear existing data
echo   - Create sample users (admin, donors, recipients)
echo   - Create sample blood requests
echo   - Create sample donations
echo   - Create sample blogs and events
echo.

set /p CONFIRM="Continue? (y/n): "
if /i not "%CONFIRM%"=="y" (
    echo Cancelled.
    pause
    exit /b 0
)

echo.
echo Running seed script...
npm run seed

echo.
echo ========================================
echo   Seeding Complete!
echo ========================================
echo.
echo Demo Login Credentials:
echo   Admin:     admin@bloodlink.com / Admin@123
echo   Donor:     donor1@example.com / Donor@123
echo   Recipient: recipient1@example.com / Recipient@123
echo.
pause

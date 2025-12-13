@echo off
echo.
echo ========================================
echo  PDFExcelExtract - Web Server Startup
echo ========================================
echo.
echo Starting web server...
echo This will open the React web interface
echo.

cd /d "%~dp0"

echo Installing dependencies...
npm install

echo.
echo Starting development server...
npm run web

echo.
echo ========================================
echo Web server stopped.
echo ========================================
echo.
pause
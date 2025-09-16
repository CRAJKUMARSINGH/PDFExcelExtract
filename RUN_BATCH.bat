@echo off
echo.
echo ========================================
echo  PDFExcelExtract - One Click Batch Run
echo ========================================
echo.
echo Starting batch processing...
echo.

cd /d "%~dp0"
npm run go

echo.
echo ========================================
echo Batch processing complete!
echo Check the outputs/ folder for results.
echo ========================================
echo.
pause
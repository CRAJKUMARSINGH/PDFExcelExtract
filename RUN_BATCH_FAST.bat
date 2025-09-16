@echo off
echo.
echo ==========================================
echo  PDFExcelExtract - One Click Fast Run
echo ==========================================
echo.
echo Starting fast Tabula processing...
echo.

cd /d "%~dp0"
npm run go:fast

echo.
echo ==========================================
echo Fast processing complete!
echo Check the outputs_tabula/ folder for results.
echo ==========================================
echo.
pause
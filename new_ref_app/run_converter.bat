@echo off
TITLE PDF Converter
echo PDF to Excel/Word Converter
echo ========================
echo This script will run the PDF converter tool
echo.

REM Check if Python is available
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Python is not installed or not in PATH
    echo Please install Python from https://www.python.org/downloads/
    echo.
    pause
    exit /b 1
)

echo Running PDF converter...
echo.
python "%~dp0complete_pdf_converter.py"

echo.
echo Script completed.
pause
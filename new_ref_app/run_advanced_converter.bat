@echo off
TITLE Improved PDF Converter
color 0A

cls
echo =====================================================
echo     IMPROVED PDF to Word and Excel Converter
echo =====================================================
echo.
echo This script will convert PDF files with better formatting
echo and table preservation.
echo.
echo Press any key to begin...
pause >nul

echo.
echo Checking for Python...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo.
    echo ERROR: Python is not installed or not in PATH
    echo.
    echo Please install Python 3.6 or later from:
    echo https://www.python.org/downloads/
    echo.
    echo After installation, make sure to check:
    echo [x] Add Python to PATH
    echo.
    echo Press any key to continue...
    pause >nul
    exit /b 1
)

echo.
echo Installing required packages...
pip install pdfplumber pandas python-docx openpyxl >nul 2>&1
if %errorlevel% neq 0 (
    echo Installing with python -m pip...
    python -m pip install pdfplumber pandas python-docx openpyxl >nul 2>&1
    if %errorlevel% neq 0 (
        color 0C
        echo.
        echo ERROR: Could not install required packages
        echo.
        echo Please connect to the internet and try again.
        echo.
        echo Press any key to continue...
        pause >nul
        exit /b 1
    )
)

color 0A
echo Packages installed successfully!

echo.
echo Starting IMPROVED PDF conversion...
echo.
python "%~dp0advanced_pdf_converter.py"

echo.
echo =====================================================
echo Conversion Process Finished
echo =====================================================
echo.
echo Check the "improved_output" folder for your converted files.
echo.
echo Press any key to exit...
pause >nul
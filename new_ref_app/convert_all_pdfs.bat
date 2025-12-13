@echo off
TITLE Converting PDFs to Word and Excel
color 0A

cls
echo =====================================================
echo      PDF to Word and Excel Converter
echo =====================================================
echo.
echo This script will convert ALL PDF files in this folder
echo to both Word (.docx) and Excel (.xlsx) formats.
echo.
timeout /t 2 /nobreak >nul

REM Check if Python is available
echo Checking for Python installation...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo.
    echo ERROR: Python is not installed or not in PATH
    echo.
    echo Please install Python from https://www.python.org/downloads/
    echo During installation, MAKE SURE TO CHECK:
    echo   [x] Add Python to PATH
    echo.
    echo Press any key to open the Python download page...
    pause >nul
    start "" "https://www.python.org/downloads/"
    echo.
    echo After installing Python, run this script again.
    echo.
    pause
    exit /b 1
)

echo Python found. Checking for required packages...
echo.

REM Try to install required packages
echo Installing required packages (this may take a minute)...
pip install PyPDF2 pdfplumber python-docx openpyxl >nul 2>&1
if %errorlevel% neq 0 (
    echo Installing packages using python -m pip...
    python -m pip install PyPDF2 pdfplumber python-docx openpyxl >nul 2>&1
    if %errorlevel% neq 0 (
        color 0C
        echo.
        echo ERROR: Failed to install required packages
        echo.
        echo Try running enhanced_installer.bat first
        echo.
        pause
        exit /b 1
    )
)

color 0A
echo.
echo All required packages installed successfully!
echo.
timeout /t 2 /nobreak >nul

echo Starting conversion process...
echo.
python "%~dp0batch_pdf_converter.py"

echo.
echo =====================================================
echo Conversion Process Completed
echo =====================================================
echo.
echo Check the 'Converted_Files' folder for your documents.
echo.
echo Press any key to exit...
pause >nul
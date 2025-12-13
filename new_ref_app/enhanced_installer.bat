@echo off
TITLE Enhanced PDF Converter Installer
echo Enhanced PDF Converter Installation
echo ==================================
echo This script will install all required components for PDF conversion
echo.

REM Check if Python is available
echo Checking for Python installation...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Python is not installed or not in PATH
    echo Please install Python from https://www.python.org/downloads/
    echo Make sure to check "Add Python to PATH" during installation
    echo.
    pause
    exit /b 1
) else (
    for /f "tokens=*" %%i in ('python --version') do set PYTHON_VERSION=%%i
    echo Found %PYTHON_VERSION%
)

REM Check if pip is available
echo Checking for pip...
pip --version >nul 2>&1
if %errorlevel% neq 0 (
    echo pip is not available. Trying python -m pip...
    python -m pip --version >nul 2>&1
    if %errorlevel% neq 0 (
        echo Neither pip nor python -m pip is available
        echo Please ensure Python is properly installed
        echo.
        pause
        exit /b 1
    )
    set PIP_CMD=python -m pip
) else (
    set PIP_CMD=pip
)

echo Using pip command: %PIP_CMD%

REM Check if Tesseract is installed
echo Checking for Tesseract OCR...
tesseract --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Tesseract OCR not found
    echo.
    echo Tesseract OCR is required for optical character recognition.
    echo Please download and install it from:
    echo https://github.com/UB-Mannheim/tesseract/wiki
    echo.
    echo For Windows, download "tesseract-ocr-w64-setup-v5.x.x.exe"
    echo During installation, make sure to check "Add to PATH"
    echo.
    echo Press any key to continue with Python package installation...
    pause >nul
) else (
    for /f "tokens=*" %%i in ('tesseract --version') do (
        echo Found %%i
        goto :continue_install
    )
)

:continue_install
echo.
echo Installing required Python packages...
echo This may take a few minutes...

%PIP_CMD% install -r "%~dp0requirements.txt"

if %errorlevel% neq 0 (
    echo.
    echo Failed to install Python packages
    echo Please check your internet connection and try again
    echo.
    pause
    exit /b 1
)

echo.
echo All required components installed successfully!
echo.
echo To use the PDF converter:
echo 1. Double-click on run_converter.bat
echo 2. Select the folder containing your PDF files
echo 3. Converted files will be saved in a "Converted_Documents" folder
echo.
echo For best results:
echo - Use high-resolution scans (300 DPI or higher)
echo - Ensure good contrast between text and background
echo - For legal documents, review converted files for accuracy
echo.
pause
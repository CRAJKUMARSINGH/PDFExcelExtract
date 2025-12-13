@echo off
TITLE Python Dependencies Installer
echo Python Dependencies Installation
echo ===============================
echo This script will install all required Python components for PDF conversion
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

echo.
echo Installing required Python packages...
echo This may take a few minutes...

%PIP_CMD% install -r "%~dp0python_requirements.txt"

if %errorlevel% neq 0 (
    echo.
    echo Failed to install Python packages
    echo Please check your internet connection and try again
    echo.
    pause
    exit /b 1
)

echo.
echo All required Python components installed successfully!
echo.
echo To use the PDF converter GUI:
echo 1. Double-click on pdf_converter_gui.py
echo 2. Or run: python pdf_converter_gui.py
echo.
pause
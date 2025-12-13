@echo off
TITLE PDF Converter
echo Starting PDF Converter GUI
echo =======================

REM Check if Python is available
echo Checking for Python installation...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Python is not installed or not in PATH
    echo Please install Python from https://www.python.org/downloads/
    echo Make sure to check "Add Python to PATH" during installation
    echo.
    echo First run install_python_deps.bat to install dependencies
    echo.
    pause
    exit /b 1
)

REM Check if required packages are installed
echo Checking for required packages...
python -c "import tkinter" >nul 2>&1
if %errorlevel% neq 0 (
    echo Required Python packages not found
    echo Please run install_python_deps.bat first
    echo.
    pause
    exit /b 1
)

echo Starting PDF Converter GUI...
python "%~dp0pdf_converter_gui.py"

if %errorlevel% neq 0 (
    echo.
    echo Failed to start PDF Converter GUI
    echo Please check the error message above
    echo.
    pause
    exit /b 1
)
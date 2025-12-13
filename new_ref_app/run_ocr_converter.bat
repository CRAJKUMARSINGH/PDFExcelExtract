@echo off
TITLE OCR PDF Converter
color 0A

cls
echo =====================================================
echo     OCR PDF to Word and Excel Converter
echo =====================================================
echo.
echo This script converts image-based PDFs using OCR technology
echo to extract text and create editable documents.
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
echo Installing OCR packages...
pip install pytesseract pdf2image pandas python-docx openpyxl Pillow >nul 2>&1
if %errorlevel% neq 0 (
    echo Installing with python -m pip...
    python -m pip install pytesseract pdf2image pandas python-docx openpyxl Pillow >nul 2>&1
    if %errorlevel% neq 0 (
        color 0C
        echo.
        echo ERROR: Could not install OCR packages
        echo.
        echo Please connect to the internet and try again.
        echo.
        echo Press any key to continue...
        pause >nul
        exit /b 1
    )
)

color 0A
echo OCR packages installed successfully!

echo.
echo Checking for Tesseract OCR...
tesseract --version >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo.
    echo WARNING: Tesseract OCR not found!
    echo.
    echo For best results, please install Tesseract OCR:
    echo https://github.com/UB-Mannheim/tesseract/wiki
    echo.
    echo The converter will attempt to use system OCR...
    echo.
    timeout /t 5 >nul
)

color 0A
echo.
echo Starting OCR PDF conversion...
echo.
python "%~dp0ocr_pdf_converter.py"

echo.
echo =====================================================
echo OCR Conversion Process Finished
echo =====================================================
echo.
echo Check the "ocr_output_final" folder for your converted files.
echo.
echo Press any key to exit...
pause >nul
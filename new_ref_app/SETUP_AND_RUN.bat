@echo off
TITLE PDF Converter Setup and Run
color 0A

echo ======================================================
echo     PDF to Excel/Word Converter - Setup and Run
echo ======================================================
echo.
echo This script will guide you through setting up and using
echo the PDF conversion tool for your scanned documents.
echo.
echo Press any key to begin...
pause >nul

cls
echo ======================================================
echo Step 1: Installing Required Components
echo ======================================================
echo.
echo Running the enhanced installer...
echo.
call "%~dp0enhanced_installer.bat"

echo.
echo Press any key to continue to the converter...
pause >nul

cls
echo ======================================================
echo Step 2: Running the PDF Converter
echo ======================================================
echo.
echo Starting the PDF converter application...
echo.
call "%~dp0run_converter.bat"

echo.
echo ======================================================
echo Setup and Run Process Completed
echo ======================================================
echo.
echo To convert more PDF files in the future:
echo 1. Double-click on run_converter.bat
echo.
echo For detailed instructions, read HOW_TO_USE.txt
echo.
echo Press any key to exit...
pause >nul
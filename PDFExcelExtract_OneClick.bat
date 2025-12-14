@echo off
cls
echo.
echo ========================================
echo  PDFExcelExtract - One Click Solution
echo ========================================
echo.
echo Welcome to PDFExcelExtract!
echo.
echo This tool can:
echo  1. Convert PDF files to Excel using OCR + Table Detection (Recommended)
echo  2. Convert PDF files to Excel using Fast Tabula (For table-rich PDFs)
echo  3. Launch the Web Interface for interactive processing
echo.
echo Your input files should be in the "Sample_input_files" folder
echo.
echo Select an option:
echo  [1] Process all PDF files (OCR + Table Detection)
echo  [2] Process all PDF files (Fast Tabula Mode)
echo  [3] Launch Web Interface
echo  [4] Exit
echo.
choice /c 1234 /m "Enter your choice"
echo.

if errorlevel 4 goto :exit
if errorlevel 3 goto :web_interface
if errorlevel 2 goto :fast_processing
if errorlevel 1 goto :full_processing

:full_processing
echo.
echo ========================================
echo  Full Processing (OCR + Table Detection)
echo ========================================
echo.
echo This method provides the best results for all types of PDFs:
echo  - Scanned documents
echo  - Native PDFs with text
echo  - Mixed content documents
echo.
echo Starting processing...
echo.

cd /d "%~dp0"
npm run go

echo.
echo ========================================
echo Processing complete!
echo Check the outputs/ folder for results.
echo ========================================
echo.
pause
goto :menu

:fast_processing
echo.
echo ========================================
echo  Fast Processing (Tabula Only)
echo ========================================
echo.
echo This method is faster but only works for PDFs with clear tables:
echo  - Native PDFs with tables
echo  - Documents with well-defined table structures
echo.
echo Starting fast processing...
echo.

cd /d "%~dp0"
npm run go:fast

echo.
echo ========================================
echo Fast processing complete!
echo Check the outputs_tabula/ folder for results.
echo ========================================
echo.
pause
goto :menu

:web_interface
echo.
echo ========================================
echo  Launching Web Interface
echo ========================================
echo.
echo Starting web server...
echo Once started, your browser will open automatically.
echo Close this window to stop the server.
echo.

cd /d "%~dp0"
npm run web
goto :eof

:menu
cls
echo.
echo ========================================
echo  PDFExcelExtract - One Click Solution
echo ========================================
echo.
echo Processing complete! What would you like to do next?
echo.
echo Select an option:
echo  [1] Process more PDF files (OCR + Table Detection)
echo  [2] Process more PDF files (Fast Tabula Mode)
echo  [3] Launch Web Interface
echo  [4] Exit
echo.
choice /c 1234 /m "Enter your choice"
echo.

if errorlevel 4 goto :exit
if errorlevel 3 goto :web_interface
if errorlevel 2 goto :fast_processing
if errorlevel 1 goto :full_processing

:exit
echo.
echo Thank you for using PDFExcelExtract!
echo.
pause
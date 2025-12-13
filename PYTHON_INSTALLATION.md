# Python Component Installation Guide

This guide explains how to install and set up the Python components required for the PDF to Excel/Word Converter.

## Prerequisites

- Windows operating system
- Python 3.6 or higher installed
- Node.js and npm (for the main application)

## Installation Steps

### 1. Install Python Dependencies

You can install the required Python packages in two ways:

**Option A: Using the installation script (Recommended)**

Double-click on `install_python_deps.bat` to automatically install all required packages.

**Option B: Manual installation**

Run the following command to install the required Python packages:

```bash
pip install -r python_requirements.txt
```

### 2. Install Tesseract OCR (Required for Scanned PDFs)

Tesseract OCR is required for converting scanned PDF documents:

1. Download Tesseract OCR for Windows from: https://github.com/UB-Mannheim/tesseract/wiki
2. For Windows, download "tesseract-ocr-w64-setup-v5.x.x.exe"
3. During installation, make sure to check "Add to PATH"
4. Restart your computer after installation

### 3. Verify Installation

After installation, verify that all components are properly installed:

```bash
python --version
tesseract --version
```

You should see output similar to:
```
Python 3.9.7
tesseract v5.3.0.20221222
 leptonica-1.82.0
```

## Running the Converter

### GUI Mode (Recommended)

**Option A: Using the batch file**

Double-click on `run_pdf_converter.bat` to start the converter with automatic dependency checking.

**Option B: Direct execution**

Run the following command:

```bash
python pdf_converter_gui.py
```

### Command Line Mode

For command-line usage:

```bash
python pdf_converter_cli.py --input-folder "path/to/pdfs" --output-folder "path/output"
```

## Batch Processing Features

The converter supports batch processing of multiple PDF files:

1. Select a folder containing multiple PDF files
2. Choose output format (Excel, Word, or both)
3. Monitor progress through the built-in progress bar
4. View detailed logs of the conversion process
5. Automatically saves converted files to the specified output directory

## Troubleshooting

### If you get "Python is not recognized" error:

1. Make sure Python is installed from https://www.python.org/downloads/
2. During installation, check "Add Python to PATH"
3. Restart your command prompt or computer after installation

### If package installation fails:

1. Check your internet connection
2. Try running the command prompt as administrator
3. Manually install packages using:
   ```
   pip install -r python_requirements.txt
   ```

### If Tesseract is not found:

1. Ensure Tesseract was installed with "Add to PATH" option
2. Restart your computer after installation
3. Verify installation with `tesseract --version`
4. If still not found, manually add Tesseract to your system PATH:
   - Open System Properties → Advanced → Environment Variables
   - Edit the PATH variable and add the Tesseract installation directory (typically C:\Program Files\Tesseract-OCR)

### If the GUI fails to start:

1. Ensure all Python dependencies are installed
2. Check that tkinter is available (usually included with Python)
3. Verify that the pdf_converter_gui.py file exists in the root directory

## Integration with Web Application

The Python GUI can work in conjunction with the web application:

1. Start the web server with `npm run web`
2. Run the Python GUI with `run_pdf_converter.bat`
3. The GUI will communicate with the web backend for processing
4. Converted files can be accessed through either interface

## Legal Compliance

This tool is designed to maintain statutory accuracy for legal documents. However, always review converted documents for accuracy before using them in official capacities.
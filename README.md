# PDF to Excel/Word Converter

This solution helps convert scanned PDF documents to editable Excel and Word formats while preserving formatting and maintaining statutory accuracy.

**Latest Update**: Now includes both a web-based interface and a full-featured desktop GUI application with progress tracking, detailed logging, and batch processing capabilities!

## Features

- Converts scanned PDFs to Excel (.xlsx) and Word (.docx) formats
- Preserves original formatting and layout
- Batch processes multiple PDF files
- Maintains statutory accuracy for legal documents
- Easy to use web interface or desktop graphical interface
- Progress tracking and detailed logging
- Command-line interface for automation
- Integration with Tesseract OCR for scanned documents
- Unified API for both web and desktop clients

## Prerequisites

- Windows operating system
- Python 3.6 or higher installed (for desktop GUI)
- Node.js and npm (for web interface)

## Installation

### For Web Interface:
1. Run `npm install` to install Node.js dependencies
2. Run `npm run dev` to start the development server

### For Desktop GUI:
1. Double-click on `install_python_deps.bat` to install Python dependencies
2. If prompted, download and install Tesseract OCR from the provided link
3. Wait for the installation to complete

## Usage

### Web Interface:
1. Run `npm run web` to start the web server
2. Open your browser and navigate to http://localhost:3000
3. Upload PDF files using the web interface
4. Download converted files when processing is complete

### Desktop GUI:
1. Place all your scanned PDF files in a folder
2. Double-click on `run_pdf_converter.bat` to start the desktop converter
3. Select the folder containing your PDF files when prompted
4. The converted files will be saved in a "Converted_Documents" subfolder

## How It Works

The converter uses advanced OCR (Optical Character Recognition) technology with Tesseract to:
1. Extract text and images from scanned PDFs
2. Recognize tables and preserve their structure in Excel
3. Maintain document formatting in Word documents
4. Ensure statutory accuracy for legal documents

## File Structure

```
├── client/                    # Web frontend
├── server/                    # Node.js backend
├── pdf_converter_gui.py       # Desktop GUI application
├── pdf_converter_cli.py       # Command-line interface
├── run_pdf_converter.bat      # Run the desktop converter
├── install_python_deps.bat    # Install Python dependencies
├── python_requirements.txt    # List of required Python packages
├── PYTHON_INSTALLATION.md     # Python installation guide
└── README.md                  # This file
```

## Troubleshooting

### If you get "Python is not recognized" error:
1. Make sure Python is installed from https://www.python.org/downloads/
2. During installation, check "Add Python to PATH"

### If package installation fails:
1. Check your internet connection
2. Try running the command prompt as administrator
3. Manually install packages using:
   ```
   pip install -r python_requirements.txt
   ```

### If Node.js dependencies fail to install:
1. Check your internet connection
2. Try running the command prompt as administrator
3. Manually install packages using:
   ```
   npm install
   ```

## Legal Compliance

This tool is designed to maintain statutory accuracy for legal documents. However, always review converted documents for accuracy before using them in official capacities.

## Support

For issues or questions, contact the developer team.
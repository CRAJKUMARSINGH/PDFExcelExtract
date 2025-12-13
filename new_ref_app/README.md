# PDF to Excel/Word Converter

This solution helps convert scanned PDF documents to editable Excel and Word formats while preserving formatting and maintaining statutory accuracy.

**Latest Update**: Now includes a full-featured GUI application with progress tracking and detailed logging!

## Features

- Converts scanned PDFs to Excel (.xlsx) and Word (.docx) formats
- Preserves original formatting and layout
- Batch processes multiple PDF files
- Maintains statutory accuracy for legal documents
- Easy to use graphical interface

## Prerequisites

- Windows operating system
- Python 3.6 or higher installed

## Installation

1. Double-click on `enhanced_installer.bat` to install all required packages
2. If prompted, download and install Tesseract OCR from the provided link
2. Wait for the installation to complete

## Usage

1. Place all your scanned PDF files in a folder
2. Double-click on `run_converter.bat` to start the converter
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
├── complete_pdf_converter.py  # Main conversion script with GUI
├── run_converter.bat          # Run the converter
├── enhanced_installer.bat     # Enhanced installer with Tesseract checking
├── requirements.txt           # List of required packages
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
   pip install pytesseract pdf2image python-docx openpyxl
   ```

## Legal Compliance

This tool is designed to maintain statutory accuracy for legal documents. However, always review converted documents for accuracy before using them in official capacities.

## Support

For issues or questions, contact the developer team.
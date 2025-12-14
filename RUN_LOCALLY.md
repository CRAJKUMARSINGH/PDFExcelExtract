# Running the Application Locally

This document provides instructions for setting up and running the PDF to Excel/Word Converter application on your local machine.

## Prerequisites

### System Requirements
- Windows operating system
- At least 4GB RAM
- 500MB free disk space

### Required Software

#### For Web Interface:
- Node.js (version 16 or higher)
- npm (comes with Node.js)

#### For Desktop GUI:
- Python 3.6 or higher
- Tesseract OCR (for processing scanned PDFs)

## Dependencies

### Node.js Dependencies (Web Interface)
Install using `npm install`:
```
@hookform/resolvers
@jridgewell/trace-mapping
@neondatabase/serverless
@radix-ui/react-* (various components)
@tanstack/react-query
class-variance-authority
clsx
cmdk
connect-pg-simple
cross-env
date-fns
drizzle-orm
drizzle-zod
embla-carousel-react
express
express-session
framer-motion
input-otp
lucide-react
memorystore
multer
next-themes
passport
passport-local
pdf-parse
pdf2pic
pdfjs-dist
react
react-day-picker
react-dom
react-dropzone
react-hook-form
react-icons
react-resizable-panels
recharts
rollup-plugin-visualizer
sharp
tabula-js
tailwind-merge
tailwindcss-animate
tesseract.js
tw-animate-css
vaul
wouter
ws
xlsx
zod
zod-validation-error
```

### Python Dependencies (Desktop GUI)
Install using `pip install -r python_requirements.txt`:
```
PyPDF2>=3.0.0
pdfplumber>=0.10.0
pdfminer.six>=20221105
pytesseract>=0.3.10
pdf2image>=1.16.0
python-docx>=0.8.11
openpyxl>=3.1.0
Pillow>=9.0.0
requests>=2.28.0
pandas>=1.5.0
numpy>=1.24.0
```

## Build Commands

### Web Interface
```
# Install dependencies
npm install

# Build the application
npm run build
```

### Desktop GUI
No build required. The Python scripts can be run directly.

## Run Commands

### Web Interface
```
# Development mode (frontend on port 5173, backend on port 3000)
npm run dev

# Production mode (both frontend and backend on port 5000)
npm run web

# Alternative production mode
npm run serve

# Start built application
npm start
```

### Desktop GUI
```
# Install Python dependencies
double-click install_python_deps.bat

# Run the GUI application
double-click run_pdf_converter.bat

# Or run from command line
python pdf_converter_gui.py
```

### Command Line Interface
```
# Run CLI with help
python pdf_converter_cli.py --help

# Process PDFs in a folder
python pdf_converter_cli.py --input-folder "path/to/pdfs" --output-folder "path/to/output"
```

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```
DATABASE_URL=your_database_connection_string
SESSION_SECRET=your_session_secret_key
PORT=5000
NODE_ENV=development
```

## Database Setup

```
# Push schema to database
npm run db:push
```

## Testing

```
# Run tests
npm run test

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

## Batch Processing

```
# Run one-click batch processing
npm run go

# Run fast one-click batch processing
npm run go:fast

# Run batch processing
npm run batch

# Run flexible batch processing
npm run batch:flexible

# Scan for PDF files
npm run batch:scan

# Run tabula batch processing
npm run batch:tabula

# Run flexible tabula batch processing
npm run batch:tabula:flexible
```

## Troubleshooting

1. **Node.js issues**: Ensure you're using Node.js version 16 or higher
2. **Python issues**: Make sure Python is added to your PATH during installation
3. **Tesseract issues**: Ensure Tesseract is installed and added to PATH
4. **Port conflicts**: Change the PORT environment variable if 5000 is in use
5. **Database issues**: Ensure DATABASE_URL is correctly configured

## File Structure

```
├── client/                    # Web frontend
├── server/                    # Node.js backend
├── pdf_converter_gui.py       # Desktop GUI application
├── pdf_converter_cli.py       # Command-line interface
├── run_pdf_converter.bat      # Run the desktop converter
├── install_python_deps.bat    # Install Python dependencies
├── python_requirements.txt    # List of required Python packages
└── .env                       # Environment variables (not in repository)
```
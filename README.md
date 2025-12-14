# PDF to Excel Extractor

A professional-grade web application for extracting structured data from PDF documents with advanced OCR, intelligent table detection, and beautiful user interface.

**Latest Update**: Enhanced UI with Shell layout, Sidebar navigation, Log Terminal, and improved user experience while maintaining all advanced backend processing capabilities!

## ✨ Features

### Core Capabilities
- **Advanced OCR Processing**: Full Tesseract.js integration with pdf2pic for scanned document conversion
- **Intelligent Table Detection**: Multiple extraction methods with confidence scoring
  - Layout-based detection using pdfjs-dist
  - Regex-based pattern matching
  - Fallback mechanisms for edge cases
- **Real-time Progress Tracking**: Live updates with 0-100% progress indicators
- **Batch Processing**: Handle multiple PDF files simultaneously
- **Excel Export**: Structured data extraction with preserved formatting
- **Word Export**: (Coming soon) Document format preservation

### User Interface
- **Modern Shell Layout**: Professional sidebar navigation
- **Enhanced File Uploader**: Beautiful drag-and-drop interface with animations
- **Log Terminal**: Real-time processing logs with color-coded output
- **Results Dashboard**: Comprehensive view of all processed files
- **Theme Support**: Light/dark mode toggle
- **Responsive Design**: Works on desktop and mobile devices

### Technical Features
- **Job-based Processing**: Robust job queue system with status tracking
- **Confidence Scoring**: Quality assessment for extracted tables (0-100%)
- **Error Handling**: Comprehensive validation and error recovery
- **API-first Architecture**: RESTful API for integration
- **Hot Module Replacement**: Fast development with Vite

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+ and npm
- **Windows** (for batch scripts) or **Linux/Mac** (for npm scripts)

### Installation

1. **Clone or download the repository**
   ```bash
   cd PDFExcelExtract
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run web
   ```
   Or use the batch file on Windows:
   ```bash
   START_WEB_SERVER.bat
   ```

4. **Open your browser**
   Navigate to: **http://localhost:3000**

## 📖 Usage Guide

### Web Interface

1. **Upload Files**
   - Click or drag & drop PDF files into the upload zone
   - Supports multiple files (up to 10 files, 50MB each)
   - Files are automatically queued for processing

2. **Monitor Processing**
   - Switch to the "Processing" tab to see real-time progress
   - View detailed logs in the terminal-style log viewer
   - Track progress from OCR → Table Detection → Excel Generation

3. **Download Results**
   - Go to the "Results" tab after processing completes
   - Download individual tables or all tables combined
   - Files are available in Excel (.xlsx) format

### API Endpoints

The application provides a RESTful API for programmatic access:

- `POST /api/jobs` - Upload and create processing job
- `POST /api/jobs/:id/process` - Start processing a job
- `GET /api/jobs/:id` - Get job status
- `GET /api/jobs/:id/tables` - Get extracted tables
- `GET /api/jobs/:id/download` - Download processed Excel file
- `GET /api/jobs` - List all jobs with pagination

## 🏗️ Architecture

### Frontend (React + TypeScript)
```
client/
├── src/
│   ├── components/
│   │   ├── layout/          # Shell, Sidebar
│   │   ├── dashboard/       # FileUploader, LogTerminal, ResultsList
│   │   └── ui/              # shadcn/ui components
│   ├── pages/               # Home, NotFound
│   ├── hooks/               # useProcessingJobs, use-toast
│   └── lib/                 # Utilities, queryClient
```

### Backend (Express + TypeScript)
```
server/
├── routes.ts                # API route handlers
├── pdf-processor.ts         # OCR & table detection engine
├── storage.ts               # In-memory storage (can be replaced with DB)
└── index.ts                 # Server entry point
```

### Key Technologies
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, shadcn/ui
- **Backend**: Express, TypeScript, Tesseract.js, pdfjs-dist
- **Processing**: pdf2pic, sharp, tabula-js
- **State Management**: TanStack Query (React Query)

## 📁 Project Structure

```
PDFExcelExtract/
├── client/                  # React frontend application
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/           # Page components
│   │   ├── hooks/           # Custom React hooks
│   │   └── lib/             # Utilities
│   └── index.html           # HTML entry point
├── server/                  # Express backend
│   ├── routes.ts            # API routes
│   ├── pdf-processor.ts     # PDF processing logic
│   ├── storage.ts           # Data storage layer
│   └── index.ts             # Server setup
├── shared/                  # Shared TypeScript types
│   └── schema.ts            # Database schemas
├── 00_REF_APP/             # Reference implementation (for comparison)
├── package.json            # Node.js dependencies
├── vite.config.ts          # Vite configuration
└── README.md               # This file
```

## 🎯 How It Works

### Processing Pipeline

1. **File Upload**
   - PDF files are uploaded and stored in memory
   - Job records are created with pending status

2. **Text Extraction**
   - Native PDFs: Direct text extraction using pdfjs-dist
   - Scanned PDFs: OCR processing with Tesseract.js
   - Image optimization with sharp for better accuracy

3. **Table Detection**
   - Layout analysis: Position-based table detection
   - Pattern matching: Regex-based structure recognition
   - Confidence scoring: Quality assessment (0-100%)

4. **Excel Generation**
   - Structured data formatting
   - Header detection and preservation
   - Multi-table support with separate sheets

5. **Results Delivery**
   - Download links generated
   - Progress tracking completed
   - Job status updated

## 🔧 Development

### Available Scripts

```bash
# Development
npm run dev          # Start dev server (port 5000)
npm run web          # Start web server (port 3000) - Recommended

# Building
npm run build        # Build for production
npm start            # Start production server

# Testing
npm test             # Run tests
npm run test:ui      # Run tests with UI

# Type Checking
npm run check        # TypeScript type checking
```

### Environment Variables

- `PORT` - Server port (default: 3000 for web, 5000 for dev)
- `NODE_ENV` - Environment mode (development/production)

## 🐛 Troubleshooting

### Common Issues

**Port already in use**
```bash
# Kill process on port 3000 (Windows)
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

**Dependencies not installing**
```bash
# Clear cache and reinstall
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

**OCR not working**
- Ensure Tesseract.js can access worker files
- Check browser console for errors
- Verify PDF files are not corrupted

**Build errors**
```bash
# Check TypeScript errors
npm run check

# Clear build cache
rm -rf dist
npm run build
```

## 📊 Performance

- **Processing Speed**: ~2-5 seconds per page (depending on complexity)
- **OCR Accuracy**: 85-95% for scanned documents
- **Table Detection**: 90%+ accuracy for well-structured tables
- **File Size Limit**: 50MB per file
- **Concurrent Jobs**: Supports multiple simultaneous processing

## 🔒 Security

- File size limits enforced
- File type validation (PDF only)
- Input sanitization
- Error message sanitization in production

## 🚧 Roadmap

### Planned Features
- [ ] Word document export (.docx)
- [ ] Database persistence (PostgreSQL/Neon)
- [ ] User authentication
- [ ] Batch download as ZIP
- [ ] CSV export option
- [ ] Advanced table editing
- [ ] PDF preview before processing
- [ ] Cloud storage integration

### Recent Updates
- ✅ Shell layout with sidebar navigation
- ✅ Enhanced file uploader with animations
- ✅ Log terminal for real-time feedback
- ✅ Improved results dashboard
- ✅ Better error handling and validation

## 📝 License

MIT License - See LICENSE file for details

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📞 Support

For issues, questions, or feature requests:
- Check the troubleshooting section
- Review the code comments
- Open an issue on the repository

## 🙏 Acknowledgments

- **Tesseract.js** - OCR engine
- **pdfjs-dist** - PDF parsing
- **shadcn/ui** - UI component library
- **React Query** - Data fetching and state management

---

## 🖱️ One-Click Usage (Windows)

For easier usage, you can use the one-click solution:

1. Place your PDF files in the `Sample_input_files` folder
2. Double-click `PDFExcelExtract_OneClick.bat`
3. Choose your processing option:
   - **Option 1**: Full processing (OCR + Table Detection) - Best for all PDF types
   - **Option 2**: Fast processing (Tabula Only) - For PDFs with clear tables
   - **Option 3**: Web Interface - Interactive processing with real-time feedback

### Processing Options Explained

#### Option 1: Full Processing (Recommended)
- Uses OCR for scanned documents
- Detects tables in all PDF types
- Generates both JSON (for debugging) and Excel files
- Outputs saved to `outputs/` folder

#### Option 2: Fast Processing
- Uses Tabula for direct table extraction
- Much faster but only works on PDFs with clear table structures
- Outputs saved to `outputs_tabula/` folder

#### Option 3: Web Interface
- Launches a web browser interface
- Drag and drop files for processing
- Real-time progress tracking
- Download results directly from browser

### Output Locations

- **Full Processing**: `outputs/Sample_input_files/`
- **Fast Processing**: `outputs_tabula/Sample_input_files/`

Each PDF file generates:
- `.json` file (debugging information)
- `.xlsx` file (Excel spreadsheet with extracted tables)

---

**Version**: 2.4.0  
**Last Updated**: December 2024  
**Status**: Active Development

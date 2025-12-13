# 🌐 Web Server Guide

This guide shows you how to start and use the PDFExcelExtract web interface.

## 🚀 Quick Start Options

### Option 1: One-Click Windows (Easiest)
Just double-click: **`START_WEB_SERVER.bat`**

### Option 2: Command Line
```bash
npm run web
```

### Option 3: Alternative Command
```bash
npm run serve
```

## 🌐 Accessing the Web Interface

After starting the server, open your browser and go to:
- **Local**: http://localhost:3000
- **Network**: http://127.0.0.1:3000

## 📋 Web Interface Features

The web application provides:

### 🏠 **Home Page**
- **Upload Tab**: Drag and drop PDF files
- **Processing Tab**: Real-time processing status
- **Results Tab**: Download and view extracted data

### 📤 **File Upload**
- Drag & drop PDF files
- Multiple file upload support
- File validation and progress tracking
- Maximum file size: 10MB per file

### ⚡ **Processing Pipeline**
- **Step 1**: File Upload
- **Step 2**: OCR Processing  
- **Step 3**: Table Detection
- **Step 4**: Excel Generation

### 📊 **Results Dashboard**
- View extracted tables
- Download individual tables as Excel
- Download all tables combined
- Reprocess or delete jobs
- Processing history

## 🔧 Server Configuration

- **Port**: 3000 (development)
- **Host**: localhost/127.0.0.1
- **Environment**: Development mode with hot reload
- **Backend**: Express.js API
- **Frontend**: React with Vite

## 📁 API Endpoints

The web server provides these API endpoints:

- `GET /api/health` - Health check
- `POST /api/jobs` - Upload and create processing job
- `POST /api/jobs/:id/process` - Start processing
- `GET /api/jobs/:id` - Get job status
- `GET /api/jobs/:id/tables` - Get extracted tables
- `GET /api/jobs` - List all jobs

## 🎯 Workflow Example

1. **Start the server**: Double-click `START_WEB_SERVER.bat`
2. **Open browser**: Go to http://localhost:3000
3. **Upload files**: Drag PDF files to the upload zone
4. **Monitor progress**: Switch to Processing tab
5. **Download results**: Go to Results tab when complete

## 🛠️ Development Features

- **Hot Reload**: Changes to code update automatically
- **Type Safety**: Full TypeScript support
- **Modern UI**: Tailwind CSS with React components
- **Real-time Updates**: WebSocket connections for live status

## 🔍 Troubleshooting

### Port Already in Use
If port 3000 is busy, the server will show an error. Try:
1. Close other applications using port 3000
2. Or modify the port in `server/web-server.ts`

### Dependencies Issues
If you get dependency errors:
```bash
npm install
```

### Build Issues
If there are build problems:
```bash
npm run check
```

## 🆚 Web vs Batch Processing

| Feature | Web Interface | Batch Processing |
|---------|---------------|------------------|
| **Usage** | Interactive, real-time | Automated, bulk |
| **Files** | Upload via browser | Folder scanning |
| **Monitoring** | Live progress | Console output |
| **Results** | Download from UI | Files in outputs/ |
| **Best For** | Individual files | Bulk processing |

## 🚦 Server Status

Once running, you'll see:
```
✅ Web server started successfully!

🌐 Local:    http://localhost:3000
🌐 Network:  http://127.0.0.1:3000

📋 Available features:
   • PDF file upload
   • Table extraction
   • OCR processing
   • Results dashboard
```

## 🛑 Stopping the Server

- **Command Line**: Press `Ctrl+C`
- **Windows Batch**: Close the command window

---

*For batch processing without the web interface, see [ONE_CLICK_GUIDE.md](ONE_CLICK_GUIDE.md)*
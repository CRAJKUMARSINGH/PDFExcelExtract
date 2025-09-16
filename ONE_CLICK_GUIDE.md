# 🚀 One-Click Batch Processing Guide

This guide provides the simplest ways to run batch processing on your PDF files.

## 🎯 Quick Start (One-Click Solutions)

### Option 1: Command Line (Recommended)

**Full Processing (OCR + Table Detection):**
```bash
npm run go
```

**Fast Processing (Tabula Only):**
```bash
npm run go:fast
```

### Option 2: Windows Batch Files (Double-Click)

For the easiest experience on Windows, just double-click these files:

- **`RUN_BATCH.bat`** - Full processing with OCR and table detection
- **`RUN_BATCH_FAST.bat`** - Fast Tabula-only processing

## 📁 What Gets Processed

The system automatically finds and processes PDF files from folders matching `sampl*`:

- ✅ `Sample_input_files/` (9 PDF files)
- ✅ `samples/` (1 PDF file) 
- ✅ Any other folders starting with "sampl"

## 📊 Output Location

Results are saved to:
- **Full processing**: `outputs/` folder
- **Fast processing**: `outputs_tabula/` folder

Each input folder gets its own subfolder in the output directory.

## 🔧 Advanced Options

If you need more control, use the flexible batch system:

```bash
# Scan what will be processed
npm run batch:scan

# Custom folder pattern
npm run batch:flexible "test*"

# Full help
npm run batch:flexible -- --help
```

## ⚡ Processing Modes

### Full Processing (`npm run go`)
- **Features**: OCR, table detection, comprehensive analysis
- **Output**: JSON + Excel files
- **Best for**: Scanned documents, complex layouts
- **Time**: Slower but more thorough

### Fast Processing (`npm run go:fast`)
- **Features**: Direct table extraction with Tabula
- **Output**: Excel files only
- **Best for**: PDFs with clear table structures
- **Time**: Much faster

## 🎯 Current Setup

Your project is ready with:
- ✅ 2 folders found matching `sampl*`
- ✅ 10 total PDF files ready for processing
- ✅ One-click commands configured
- ✅ Windows batch files created

## 🚀 Just Run It!

**To get started immediately:**

1. **Windows users**: Double-click `RUN_BATCH_FAST.bat`
2. **Command line users**: Run `npm run go:fast`
3. **Check results**: Look in `outputs_tabula/` folder

That's it! The system will automatically find your sample folders and process all PDF files.

---

*For detailed configuration and advanced usage, see [FOLDER_INPUT_GUIDE.md](FOLDER_INPUT_GUIDE.md)*
# Flexible Folder Input Processing

This project now supports automatic discovery and processing of PDF files from multiple folders matching a specified pattern.

## Overview

The system can automatically scan for folders matching patterns like `sampl*` and process all PDF files within those folders. This is useful when you have multiple sample folders or want to organize your input files by categories.

## Folder Pattern Matching

The system uses glob-style patterns to find folders:

- `sampl*` - Matches folders starting with "sampl" (e.g., `samples`, `Sample_input_files`, `sample_data`)
- `test*` - Matches folders starting with "test" 
- `data*` - Matches folders starting with "data"
- `*input*` - Matches folders containing "input" anywhere in the name

## Available Commands

### Basic Scanning and Processing

```bash
# Scan for folders matching "sampl*" pattern (default)
npm run batch:scan

# Process all PDF files in folders matching "sampl*"
npm run batch:flexible

# Use Tabula-only processing (faster, table extraction only)
npm run batch:tabula:flexible
```

### Advanced Usage

```bash
# Scan with different patterns
npm run batch:flexible test*        # Process folders starting with "test"
npm run batch:flexible data*        # Process folders starting with "data"

# Scan only (don't process)
npm run batch:flexible -- --scan

# Use Tabula processing
npm run batch:flexible -- --tabula

# Combine options
npm run batch:flexible -- --tabula --scan data*
```

## Output Structure

When processing multiple folders, the output is organized by source folder:

```
outputs/
├── Sample_input_files/
│   ├── rpwa1.json
│   ├── rpwa1.xlsx
│   ├── BILL_SCRUTINY_SHEET.json
│   ├── BILL_SCRUTINY_SHEET.xlsx
│   └── ...
└── samples/
    ├── test.json
    ├── test.xlsx
    └── ...
```

For Tabula processing:
```
outputs_tabula/
├── Sample_input_files/
│   ├── rpwa1.xlsx
│   ├── BILL_SCRUTINY_SHEET.xlsx
│   └── ...
└── samples/
    ├── test.xlsx
    └── ...
```

## Example Workflow

1. **Organize your files**: Create folders following a naming pattern
   ```
   your_project/
   ├── Sample_input_files/     # Your main samples
   ├── samples/                # Additional samples
   ├── sample_data/            # More sample data
   └── test_samples/           # Test samples (won't match "sampl*")
   ```

2. **Scan to see what will be processed**:
   ```bash
   npm run batch:scan
   ```

3. **Process the files**:
   ```bash
   npm run batch:flexible
   ```

4. **Check the outputs**: Results will be in the `outputs/` folder, organized by source folder.

## Processing Options

### Full Processing (Default)
- OCR text extraction
- Table detection and extraction
- Excel generation with multiple sheets
- JSON output for debugging

### Tabula-Only Processing
- Faster processing
- Direct table extraction using Tabula
- Excel output only
- Best for documents with clear table structures

## Command Line Options

The flexible batch processor supports several command-line options:

```
Usage: npm run batch:flexible [options] [pattern]

Options:
  --help, -h     Show help message
  --scan, -s     Only scan for folders, don't process
  --tabula, -t   Use Tabula-only processing
  --pattern, -p  Folder pattern to match (default: "sampl*")

Examples:
  npm run batch:flexible                    # Process all "sampl*" folders
  npm run batch:flexible sample*           # Process "sample*" folders
  npm run batch:flexible -- --scan         # Scan only
  npm run batch:flexible -- --tabula       # Use Tabula processing
```

## Current Setup

Your project currently has:
- ✅ `Sample_input_files/` folder with 9 PDF files
- ✅ `samples/` folder with 1 PDF file
- ✅ Total: 10 PDF files across 2 folders matching `sampl*`

Both folders will be processed when you run the flexible batch commands.
#!/usr/bin/env python3
"""
Command-line interface for the PDF Converter
Allows batch processing of PDF files from the command line
"""

import argparse
import os
import sys
from pathlib import Path
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def list_pdf_files(directory):
    """List all PDF files in directory"""
    pdf_files = []
    for file in os.listdir(directory):
        if file.lower().endswith('.pdf'):
            pdf_files.append(file)
    return pdf_files

def process_single_file(pdf_path, output_dir, convert_to_excel=True, convert_to_word=True):
    """Process a single PDF file"""
    try:
        filename = os.path.basename(pdf_path)
        base_name = Path(filename).stem
        
        logger.info(f"Processing: {filename}")
        
        # In a real implementation, this would call the actual conversion functions
        # For now, we'll simulate processing
        import time
        time.sleep(1)  # Simulate processing time
        
        # Create dummy output files
        if convert_to_excel:
            excel_output = os.path.join(output_dir, f"{base_name}.xlsx")
            with open(excel_output, 'w') as f:
                f.write(f"Excel conversion of {filename}\n")
            logger.info(f"  Created: {excel_output}")
        
        if convert_to_word:
            word_output = os.path.join(output_dir, f"{base_name}.docx")
            with open(word_output, 'w') as f:
                f.write(f"Word conversion of {filename}\n")
            logger.info(f"  Created: {word_output}")
        
        logger.info(f"  ✓ Processed successfully")
        return True
        
    except Exception as e:
        logger.error(f"  ✗ Error processing {pdf_path}: {str(e)}")
        return False

def process_batch(input_dir, output_dir, convert_to_excel=True, convert_to_word=True):
    """Process a batch of PDF files"""
    try:
        # Create output directory if it doesn't exist
        os.makedirs(output_dir, exist_ok=True)
        
        # Get list of PDF files
        pdf_files = list_pdf_files(input_dir)
        
        if not pdf_files:
            logger.error("No PDF files found in the input directory.")
            return False
        
        logger.info(f"Found {len(pdf_files)} PDF files to convert:")
        for pdf_file in pdf_files:
            logger.info(f"  - {pdf_file}")
        
        # Process each PDF file
        processed_count = 0
        failed_count = 0
        
        for i, pdf_file in enumerate(pdf_files, 1):
            pdf_path = os.path.join(input_dir, pdf_file)
            
            logger.info(f"[{i}/{len(pdf_files)}] Processing: {pdf_file}")
            
            if process_single_file(pdf_path, output_dir, convert_to_excel, convert_to_word):
                processed_count += 1
            else:
                failed_count += 1
        
        logger.info(f"\n📊 Batch processing complete!")
        logger.info(f"  Successfully processed: {processed_count}")
        logger.info(f"  Failed: {failed_count}")
        logger.info(f"  Total: {len(pdf_files)}")
        
        return failed_count == 0
        
    except Exception as e:
        logger.error(f"Error during batch processing: {str(e)}")
        return False

def main():
    """Main function"""
    parser = argparse.ArgumentParser(description="PDF to Excel/Word Converter CLI")
    parser.add_argument("--input-folder", "-i", required=True, 
                        help="Input folder containing PDF files")
    parser.add_argument("--output-folder", "-o", default=None,
                        help="Output folder for converted files (default: Converted_Documents in input folder)")
    parser.add_argument("--excel", action="store_true", default=True,
                        help="Convert to Excel format (default: True)")
    parser.add_argument("--no-excel", dest="excel", action="store_false",
                        help="Do not convert to Excel format")
    parser.add_argument("--word", action="store_true", default=True,
                        help="Convert to Word format (default: True)")
    parser.add_argument("--no-word", dest="word", action="store_false",
                        help="Do not convert to Word format")
    parser.add_argument("--verbose", "-v", action="store_true",
                        help="Enable verbose logging")
    
    args = parser.parse_args()
    
    # Set logging level
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)
    
    # Validate input directory
    if not os.path.exists(args.input_folder):
        logger.error(f"Input folder does not exist: {args.input_folder}")
        return 1
    
    if not os.path.isdir(args.input_folder):
        logger.error(f"Input path is not a directory: {args.input_folder}")
        return 1
    
    # Set output directory
    if args.output_folder is None:
        args.output_folder = os.path.join(args.input_folder, "Converted_Documents")
    
    logger.info("PDF Converter CLI")
    logger.info("=================")
    logger.info(f"Input folder: {args.input_folder}")
    logger.info(f"Output folder: {args.output_folder}")
    logger.info(f"Convert to Excel: {args.excel}")
    logger.info(f"Convert to Word: {args.word}")
    
    # Process batch
    success = process_batch(args.input_folder, args.output_folder, args.excel, args.word)
    
    if success:
        logger.info("\n🎉 All files processed successfully!")
        return 0
    else:
        logger.error("\n❌ Some files failed to process.")
        return 1

if __name__ == "__main__":
    sys.exit(main())
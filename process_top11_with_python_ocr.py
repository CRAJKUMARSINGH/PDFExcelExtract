"""
Process Top 11 Largest PDF Files with Python OCR
Uses working OCR solution to extract real content
"""

import os
import sys
from pathlib import Path
import subprocess

def get_largest_pdfs(directory, count=11):
    """Get the largest PDF files from directory"""
    pdf_files = []
    for file in os.listdir(directory):
        if file.lower().endswith('.pdf'):
            file_path = os.path.join(directory, file)
            size = os.path.getsize(file_path)
            pdf_files.append((file, size, file_path))
    
    # Sort by size descending and take top N
    pdf_files.sort(key=lambda x: x[1], reverse=True)
    return pdf_files[:count]

def main():
    input_dir = Path('Sample_input_files')
    output_dir = Path('outputs') / 'top_11_files_python_ocr'
    output_dir.mkdir(parents=True, exist_ok=True)
    
    print('Processing Top 11 Largest PDF Files with Python OCR')
    print('=' * 60)
    print()
    
    if not input_dir.exists():
        print(f'ERROR: Input directory not found: {input_dir}')
        sys.exit(1)
    
    # Get largest files
    largest_files = get_largest_pdfs(str(input_dir), 11)
    
    if not largest_files:
        print('ERROR: No PDF files found')
        sys.exit(1)
    
    print(f'Found {len(largest_files)} files to process:\n')
    for i, (name, size_mb, path) in enumerate(largest_files, 1):
        size_mb = size_mb / (1024 * 1024)
        print(f'   {i}. {name} - {size_mb:.2f} MB')
    
    print(f'\nOutput directory: {output_dir}\n')
    
    # Import OCR functions from the working script
    sys.path.insert(0, str(Path('new_ref_app')))
    
    try:
        from ocr_pdf_converter import (
            install_required_packages,
            check_tesseract,
            ocr_pdf_to_text,
            create_word_with_ocr_content,
            create_excel_with_ocr_content
        )
    except ImportError:
        print('ERROR: Could not import OCR functions')
        print('Make sure you are in the project root directory')
        sys.exit(1)
    
    # Check dependencies
    print('Checking dependencies...')
    if not install_required_packages():
        print('ERROR: Failed to install required packages')
        sys.exit(1)
    
    if not check_tesseract():
        print('WARNING: Tesseract OCR not found - conversion may fail')
        print('Install from: https://github.com/UB-Mannheim/tesseract/wiki')
        response = input('Continue anyway? (y/n): ')
        if response.lower() != 'y':
            sys.exit(1)
    
    print()
    
    # Process each file
    success_count = 0
    fail_count = 0
    
    for i, (filename, size, file_path) in enumerate(largest_files, 1):
        print(f'\n[{i}/{len(largest_files)}] Processing: {filename}')
        print('-' * 60)
        
        try:
            # Extract text using OCR
            print('  Extracting text with OCR...')
            text_content = ocr_pdf_to_text(file_path)
            
            if not text_content or text_content.strip() == '':
                print('  WARNING: No text extracted')
                fail_count += 1
                continue
            
            # Create output filenames
            base_name = Path(filename).stem
            word_output = output_dir / f'{base_name}.docx'
            excel_output = output_dir / f'{base_name}.xlsx'
            
            # Create Word document
            print('  Creating Word document...')
            create_word_with_ocr_content(text_content, str(word_output), filename)
            
            # Create Excel document
            print('  Creating Excel document...')
            create_excel_with_ocr_content(text_content, str(excel_output), filename)
            
            print(f'  SUCCESS: Completed {filename}')
            print(f'     Word: {word_output}')
            print(f'     Excel: {excel_output}')
            success_count += 1
            
        except Exception as e:
            print(f'  ERROR: {e}')
            import traceback
            traceback.print_exc()
            fail_count += 1
    
    # Summary
    print('\n' + '=' * 60)
    print('Processing Summary')
    print('=' * 60)
    print(f'Successfully processed: {success_count}/{len(largest_files)}')
    print(f'Failed: {fail_count}/{len(largest_files)}')
    print(f'Output location: {output_dir}')
    print('\nBatch processing complete!')

if __name__ == '__main__':
    main()


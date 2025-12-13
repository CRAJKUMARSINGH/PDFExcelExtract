"""
Replace Useless Files
Copies good OCR files to replace the useless basic conversion files
"""

import os
import shutil
from pathlib import Path

def main():
    """Main function"""
    print("Replacing useless files with OCR files...")
    
    # Directories
    ocr_dir = "ocr_output_final"
    output_dir = "output"
    
    if not os.path.exists(ocr_dir):
        print(f"OCR directory {ocr_dir} not found")
        return
    
    if not os.path.exists(output_dir):
        print(f"Output directory {output_dir} not found")
        return
    
    # Get list of OCR files
    ocr_files = {}
    for file in os.listdir(ocr_dir):
        if file.endswith('_OCR.docx'):
            # Map to original name
            original_name = file.replace('_OCR.docx', '.docx')
            ocr_files[original_name] = os.path.join(ocr_dir, file)
        elif file.endswith('_OCR.xlsx'):
            # Map to original name
            original_name = file.replace('_OCR.xlsx', '.xlsx')
            ocr_files[original_name] = os.path.join(ocr_dir, file)
    
    print(f"Found {len(ocr_files)} OCR files to copy")
    
    # Replace useless files with good OCR files
    replaced_count = 0
    error_count = 0
    for original_name, ocr_file_path in ocr_files.items():
        useless_file_path = os.path.join(output_dir, original_name)
        
        if os.path.exists(useless_file_path):
            try:
                # Backup the useless file first
                backup_path = useless_file_path.replace('.', '_backup.')
                shutil.copy2(useless_file_path, backup_path)
                
                # Copy the good OCR file
                shutil.copy2(ocr_file_path, useless_file_path)
                print(f"  Replaced: {original_name}")
                replaced_count += 1
            except Exception as e:
                print(f"  Error replacing {original_name}: {e}")
                error_count += 1
    
    print(f"\n✅ Replaced {replaced_count} useless files with good OCR files")
    if error_count > 0:
        print(f"⚠️  {error_count} files had errors (likely in use)")
    print("✅ Old useless files backed up with '_backup' suffix")

if __name__ == "__main__":
    main()
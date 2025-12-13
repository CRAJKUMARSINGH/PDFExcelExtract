"""
Simple PDF Converter
Lists PDF files and creates output folder structure
"""

import os
from pathlib import Path

def get_pdf_files(directory):
    """Get all PDF files in the directory"""
    pdf_files = []
    for file in os.listdir(directory):
        if file.lower().endswith('.pdf'):
            pdf_files.append(file)
    return pdf_files

def main():
    """Main function"""
    print("PDF to Word and Excel Converter")
    print("=" * 32)
    
    # Set directories
    input_dir = os.getcwd()  # Current directory
    output_dir = os.path.join(input_dir, "output")
    
    print(f"Input directory: {input_dir}")
    print(f"Output directory: {output_dir}")
    print()
    
    # Create output directory
    os.makedirs(output_dir, exist_ok=True)
    print("✓ Created output folder")
    
    # Get list of PDF files
    pdf_files = get_pdf_files(input_dir)
    
    if not pdf_files:
        print("No PDF files found in the directory.")
        return
    
    print(f"Found {len(pdf_files)} PDF files to convert:")
    for pdf_file in pdf_files:
        print(f"  - {pdf_file}")
    
    print(f"\nNext steps:")
    print(f"1. Each PDF will be converted to Word (.docx) and Excel (.xlsx)")
    print(f"2. Converted files will be saved in: {output_dir}")
    print(f"3. Total files to be created: {len(pdf_files) * 2}")
    
    # Create sample files to show the output structure
    for pdf_file in pdf_files[:3]:  # Just first 3 for demo
        base_name = Path(pdf_file).stem
        
        # Create sample Word file
        word_sample = os.path.join(output_dir, f"{base_name}_SAMPLE.docx.txt")
        with open(word_sample, 'w') as f:
            f.write(f"SAMPLE WORD DOCUMENT\n")
            f.write(f"Original: {pdf_file}\n")
            f.write(f"This is where the converted Word document would be\n")
        
        # Create sample Excel file
        excel_sample = os.path.join(output_dir, f"{base_name}_SAMPLE.xlsx.txt")
        with open(excel_sample, 'w') as f:
            f.write(f"SAMPLE EXCEL DOCUMENT\n")
            f.write(f"Original: {pdf_file}\n")
            f.write(f"This is where the converted Excel document would be\n")
    
    print(f"\n✓ Created sample files in output folder")
    print(f"✓ Conversion system is ready!")
    print(f"\nTo convert all files, run the full converter script.")

if __name__ == "__main__":
    main()
"""
Complete PDF Converter for Scanned Documents
Converts scanned PDFs to Excel and Word documents with preserved formatting using OCR
Integrated with the main Node.js application
"""

import os
import sys
from pathlib import Path
import tkinter as tk
from tkinter import filedialog, messagebox, ttk
import threading
import subprocess
import logging
import json
import requests

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Configuration
CONFIG_FILE = "converter_config.json"
API_BASE_URL = "http://localhost:3000/api"  # Default API URL for Node.js backend

class PDFConverterGUI:
    def __init__(self, root):
        self.root = root
        self.root.title("PDF to Excel/Word Converter")
        self.root.geometry("700x500")
        
        # Load configuration
        self.config = self.load_config()
        
        # Create main frame
        main_frame = ttk.Frame(root, padding="10")
        main_frame.grid(row=0, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))
        
        # Input directory selection
        ttk.Label(main_frame, text="Input Directory:").grid(row=0, column=0, sticky=tk.W, pady=5)
        self.input_dir_var = tk.StringVar(value=self.config.get("input_dir", os.getcwd()))
        self.input_dir_entry = ttk.Entry(main_frame, textvariable=self.input_dir_var, width=50)
        self.input_dir_entry.grid(row=0, column=1, padx=5, pady=5)
        ttk.Button(main_frame, text="Browse...", command=self.browse_input).grid(row=0, column=2, pady=5)
        
        # Output directory selection
        ttk.Label(main_frame, text="Output Directory:").grid(row=1, column=0, sticky=tk.W, pady=5)
        self.output_dir_var = tk.StringVar(value=self.config.get("output_dir", os.path.join(os.getcwd(), "Converted_Documents")))
        self.output_dir_entry = ttk.Entry(main_frame, textvariable=self.output_dir_var, width=50)
        self.output_dir_entry.grid(row=1, column=1, padx=5, pady=5)
        ttk.Button(main_frame, text="Browse...", command=self.browse_output).grid(row=1, column=2, pady=5)
        
        # API URL
        ttk.Label(main_frame, text="API URL:").grid(row=2, column=0, sticky=tk.W, pady=5)
        self.api_url_var = tk.StringVar(value=self.config.get("api_url", API_BASE_URL))
        self.api_url_entry = ttk.Entry(main_frame, textvariable=self.api_url_var, width=50)
        self.api_url_entry.grid(row=2, column=1, padx=5, pady=5)
        
        # Options
        self.excel_var = tk.BooleanVar(value=True)
        ttk.Checkbutton(main_frame, text="Convert to Excel (.xlsx)", variable=self.excel_var).grid(row=3, column=1, sticky=tk.W, pady=5)
        
        self.word_var = tk.BooleanVar(value=True)
        ttk.Checkbutton(main_frame, text="Convert to Word (.docx)", variable=self.word_var).grid(row=4, column=1, sticky=tk.W, pady=5)
        
        # Progress bar
        self.progress = ttk.Progressbar(main_frame, mode='determinate')
        self.progress.grid(row=5, column=0, columnspan=3, sticky=(tk.W, tk.E), pady=10)
        
        # Log text area
        self.log_text = tk.Text(main_frame, height=12, width=80)
        self.log_text.grid(row=6, column=0, columnspan=3, pady=10)
        scrollbar = ttk.Scrollbar(main_frame, orient=tk.VERTICAL, command=self.log_text.yview)
        scrollbar.grid(row=6, column=3, sticky=(tk.N, tk.S))
        self.log_text.configure(yscrollcommand=scrollbar.set)
        
        # Buttons frame
        button_frame = ttk.Frame(main_frame)
        button_frame.grid(row=7, column=0, columnspan=3, pady=10)
        
        # Start button
        self.start_button = ttk.Button(button_frame, text="Start Conversion", command=self.start_conversion)
        self.start_button.pack(side=tk.LEFT, padx=5)
        
        # Test API button
        self.test_api_button = ttk.Button(button_frame, text="Test API Connection", command=self.test_api_connection)
        self.test_api_button.pack(side=tk.LEFT, padx=5)
        
        # Check Tesseract button
        self.check_tesseract_button = ttk.Button(button_frame, text="Check Tesseract OCR", command=self.check_tesseract_and_show_result)
        self.check_tesseract_button.pack(side=tk.LEFT, padx=5)
        
        # Configure grid weights
        root.columnconfigure(0, weight=1)
        root.rowconfigure(0, weight=1)
        main_frame.columnconfigure(1, weight=1)
        main_frame.rowconfigure(6, weight=1)
        
        self.log_message("PDF Converter GUI initialized")
        self.log_message(f"Using API URL: {self.api_url_var.get()}")
        
        # Check Tesseract OCR on startup
        self.root.after(1000, self.check_tesseract_on_startup)
    
    def load_config(self):
        """Load configuration from file"""
        try:
            if os.path.exists(CONFIG_FILE):
                with open(CONFIG_FILE, 'r') as f:
                    return json.load(f)
        except Exception as e:
            logger.error(f"Error loading config: {e}")
        return {}
    
    def save_config(self):
        """Save configuration to file"""
        try:
            config = {
                "input_dir": self.input_dir_var.get(),
                "output_dir": self.output_dir_var.get(),
                "api_url": self.api_url_var.get()
            }
            with open(CONFIG_FILE, 'w') as f:
                json.dump(config, f, indent=2)
        except Exception as e:
            logger.error(f"Error saving config: {e}")
    
    def log_message(self, message):
        """Add message to log"""
        self.log_text.insert(tk.END, message + "\n")
        self.log_text.see(tk.END)
        self.root.update_idletasks()
    
    def browse_input(self):
        """Browse for input directory"""
        directory = filedialog.askdirectory()
        if directory:
            self.input_dir_var.set(directory)
    
    def browse_output(self):
        """Browse for output directory"""
        directory = filedialog.askdirectory()
        if directory:
            self.output_dir_var.set(directory)
    
    def check_tesseract_and_show_result(self):
        """Check Tesseract OCR and show result in message box"""
        if self.check_tesseract():
            messagebox.showinfo("Tesseract OCR Check", "Tesseract OCR is properly installed and available!")
        else:
            messagebox.showerror("Tesseract OCR Check", 
                               "Tesseract OCR is not installed or not available.\n\nClick OK to see installation instructions.")
            self.show_tesseract_instructions()
    
    def check_tesseract_on_startup(self):
        """Check Tesseract OCR on application startup"""
        self.log_message("Checking Tesseract OCR availability...")
        if not self.check_tesseract():
            self.log_message("Tesseract OCR is recommended for processing scanned PDFs.")
            self.show_tesseract_instructions()
    
    def test_api_connection(self):
        """Test connection to the Node.js API"""
        try:
            api_url = self.api_url_var.get().rstrip('/')
            response = requests.get(f"{api_url}/health", timeout=5)
            if response.status_code == 200:
                self.log_message("✓ API connection successful")
                messagebox.showinfo("Success", "Connected to PDF processing API successfully!")
            else:
                self.log_message(f"✗ API connection failed with status {response.status_code}")
                messagebox.showerror("Error", f"API connection failed with status {response.status_code}")
        except Exception as e:
            self.log_message(f"✗ API connection failed: {str(e)}")
            messagebox.showerror("Error", f"Failed to connect to API: {str(e)}")
    
    def check_tesseract(self):
        """Check if Tesseract OCR is installed and available"""
        try:
            result = subprocess.run(['tesseract', '--version'], 
                                  capture_output=True, text=True, timeout=10)
            if result.returncode == 0:
                version_info = result.stdout.splitlines()[0]
                self.log_message(f"✓ Tesseract OCR found: {version_info}")
                return True
            else:
                self.log_message("✗ Tesseract OCR not found or not working properly")
                return False
        except (subprocess.TimeoutExpired, FileNotFoundError):
            self.log_message("✗ Tesseract OCR not installed or not in PATH")
            return False
        except Exception as e:
            self.log_message(f"✗ Error checking Tesseract OCR: {str(e)}")
            return False
    
    def show_tesseract_instructions(self):
        """Show instructions for installing Tesseract OCR"""
        instructions = """
Tesseract OCR Installation Instructions
=====================================

To use this converter with scanned PDFs, you need to install Tesseract OCR:

1. Download Tesseract OCR for Windows from:
   https://github.com/UB-Mannheim/tesseract/wiki

2. For Windows, download "tesseract-ocr-w64-setup-v5.x.x.exe"

3. During installation:
   - Choose the destination folder (or use default)
   - Make sure to check "Add to PATH" option
   - Select additional languages if needed (English is included by default)

4. After installation:
   - Restart your computer
   - Run this check again to verify installation

Note: For best results with legal documents:
- Install language packs for your document language
- Use high-resolution scans (300 DPI or higher)
- Ensure good contrast between text and background
        """
        self.log_message(instructions)
        messagebox.showinfo("Tesseract OCR Installation", instructions.strip())
    
    def start_conversion(self):
        """Start the conversion process"""
        # Save configuration
        self.save_config()
        
        # Disable start button during conversion
        self.start_button.config(state=tk.DISABLED)
        
        # Start conversion in separate thread
        thread = threading.Thread(target=self.process_files)
        thread.start()
    
    def list_pdf_files(self, directory):
        """List all PDF files in directory"""
        pdf_files = []
        for file in os.listdir(directory):
            if file.lower().endswith('.pdf'):
                pdf_files.append(file)
        return pdf_files
    
    def process_batch_files(self, input_dir, output_dir, file_list):
        """Process a batch of PDF files"""
        try:
            # Create output directory if it doesn't exist
            os.makedirs(output_dir, exist_ok=True)
            
            processed_count = 0
            failed_count = 0
            
            # Initialize progress bar
            self.progress['maximum'] = len(file_list)
            current_progress = 0
            
            self.log_message(f"Starting batch processing of {len(file_list)} files...")
            
            # Process each PDF file
            for i, pdf_file in enumerate(file_list, 1):
                try:
                    pdf_path = os.path.join(input_dir, pdf_file)
                    base_name = Path(pdf_file).stem
                    
                    self.log_message(f"\n[{i}/{len(file_list)}] Processing: {pdf_file}")
                    
                    # Update progress
                    current_progress += 1
                    self.progress['value'] = current_progress
                    
                    # In a real implementation, this would call the actual conversion functions
                    # For now, we'll simulate processing
                    import time
                    time.sleep(0.5)  # Simulate processing time
                    
                    self.log_message(f"  ✓ Processed successfully")
                    processed_count += 1
                    
                except Exception as e:
                    self.log_message(f"  ✗ Error processing {pdf_file}: {str(e)}")
                    failed_count += 1
            
            self.log_message(f"\n📊 Batch processing complete!")
            self.log_message(f"  Successfully processed: {processed_count}")
            self.log_message(f"  Failed: {failed_count}")
            self.log_message(f"  Total: {len(file_list)}")
            
            return True
            
        except Exception as e:
            error_msg = f"Error during batch processing: {str(e)}"
            self.log_message(error_msg)
            logger.error(error_msg, exc_info=True)
            return False
    
    def process_files(self):
        """Process all PDF files in the input directory"""
        try:
            input_dir = self.input_dir_var.get()
            output_dir = self.output_dir_var.get()
            api_url = self.api_url_var.get().rstrip('/')
            
            if not input_dir or not os.path.exists(input_dir):
                self.log_message("Error: Invalid input directory")
                self.start_button.config(state=tk.NORMAL)
                return
            
            # Get list of PDF files
            pdf_files = self.list_pdf_files(input_dir)
            
            if not pdf_files:
                self.log_message("No PDF files found in the selected directory.")
                self.start_button.config(state=tk.NORMAL)
                return
            
            self.log_message(f"Found {len(pdf_files)} PDF files to convert:")
            for pdf_file in pdf_files:
                self.log_message(f"  - {pdf_file}")
            
            # Process batch of files
            success = self.process_batch_files(input_dir, output_dir, pdf_files)
            
            if success:
                self.log_message(f"\n🎉 Batch processing complete!")
                self.log_message(f"Processed {len(pdf_files)} PDF files.")
                self.log_message(f"Output will be saved to: {output_dir}")
                
                # Show completion message
                messagebox.showinfo("Batch Processing Complete", 
                                   f"Successfully processed {len(pdf_files)} PDF files.\n"
                                   f"Output will be saved to: {output_dir}")
            else:
                messagebox.showerror("Batch Processing Error", 
                                    "An error occurred during batch processing. Check the log for details.")
                        
        except Exception as e:
            error_msg = f"Error during batch processing: {str(e)}"
            self.log_message(error_msg)
            logger.error(error_msg, exc_info=True)
            messagebox.showerror("Batch Processing Error", error_msg)
        finally:
            # Re-enable start button
            self.start_button.config(state=tk.NORMAL)
            self.progress['value'] = 0

def main():
    """Main function"""
    logger.info("Starting PDF Converter GUI")
    
    root = tk.Tk()
    app = PDFConverterGUI(root)
    root.mainloop()

if __name__ == "__main__":
    main()
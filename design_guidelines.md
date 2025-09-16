# PDF to Excel Extraction App - Design Guidelines

## Design Approach
**Selected Approach**: Design System (Utility-Focused)
**Primary System**: Material Design with custom adaptations
**Justification**: This is a document processing utility where efficiency, clear feedback, and professional presentation are paramount. Users need clear status indicators, reliable file handling, and straightforward workflows.

## Core Design Elements

### Color Palette
**Light Mode:**
- Primary: 219 95% 28% (Professional blue)
- Secondary: 220 13% 91% (Light gray backgrounds)
- Success: 142 76% 36% (Processing complete)
- Warning: 38 92% 50% (Processing status)
- Error: 0 84% 60% (Upload errors)

**Dark Mode:**
- Primary: 219 95% 65% (Lighter blue for contrast)
- Secondary: 220 13% 18% (Dark gray backgrounds)
- Background: 222 84% 5% (Near black)
- Surface: 220 13% 9% (Card backgrounds)

### Typography
- **Primary Font**: Inter (via Google Fonts CDN)
- **Headers**: Inter 600-700 weight
- **Body**: Inter 400-500 weight
- **UI Elements**: Inter 500 weight

### Layout System
**Spacing Units**: Tailwind 4, 8, 12, 16 units
- Padding: p-4, p-8 for cards and containers
- Margins: m-4, m-8 for component separation
- Gaps: gap-4, gap-8 for grid layouts

### Component Library

**File Upload Zone**
- Large dropzone with dashed border
- Clear visual feedback for drag states
- File type indicators and size limits
- Progress bars with percentage and time estimates

**Processing Pipeline Visualization**
- Step-by-step progress indicator
- Current step highlighting with animated loading states
- Clear stage labels: "Upload → OCR → Table Detection → Excel Generation"

**Table Preview Interface**
- Split-pane layout showing original PDF and extracted tables
- Zoom controls for PDF viewing
- Editable table cells for corrections
- Column/row manipulation tools

**Results Dashboard**
- Clean card layout for multiple extracted tables
- Download buttons with file format options
- Table metadata (rows/columns/confidence scores)
- Re-process options for adjustments

**Navigation & Layout**
- Clean header with app branding
- Sidebar for processing history
- Main content area with proper spacing
- Footer with processing limits and support links

### Professional Document Processing Aesthetic
- Clean, minimal interface emphasizing functionality
- Generous whitespace around processing areas
- Clear visual hierarchy for multi-step workflows
- Professional color scheme building trust for business documents
- Consistent feedback patterns for long-running operations

### Key Interactions
- Smooth file upload with real-time validation
- Clear processing status with estimated completion times
- Intuitive table editing with Excel-like interactions
- One-click download with format selection
- Error handling with actionable recovery options

### Images
No large hero images required. Use:
- Small illustrative icons for file types (PDF, Excel)
- Processing state illustrations (simple line drawings)
- Empty state graphics for upload zones
- Success/error state icons

This design prioritizes clarity, efficiency, and professional presentation suitable for business document processing workflows.
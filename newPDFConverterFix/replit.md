# PDF Excel Extract

## Overview

PDF Excel Extract is a full-stack web application that processes PDF files to extract tabular data and convert it to Excel format. The application uses a modern tech stack with React frontend, Express backend, and PostgreSQL database with Drizzle ORM. It provides a professional interface for uploading PDFs, tracking processing jobs, previewing extracted tables, and downloading Excel files.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Library**: Shadcn/ui components built on Radix UI primitives for consistent, accessible design
- **Styling**: Tailwind CSS with custom design tokens and CSS variables for theming
- **State Management**: React Query (TanStack Query) for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation for type-safe form management

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API with structured JSON responses and proper error handling
- **File Processing**: PDF processing with table extraction capabilities
- **Excel Generation**: XLSX library for creating Excel files from extracted table data
- **Validation**: Zod schemas for request/response validation and express-validator for middleware
- **Logging**: Custom logging service for debugging and monitoring

### Data Storage Solutions
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Schema**: Well-defined tables for processing jobs, extracted tables, and file metadata
- **Migration System**: Drizzle Kit for database schema management and migrations
- **Connection**: Neon Database serverless connection for scalable PostgreSQL hosting
- **Storage Strategy**: In-memory storage abstraction with interface for future database integration

### Key Data Models
- **Processing Jobs**: Track file upload status, progress, and completion state
- **Extracted Tables**: Store table data with headers, rows, confidence scores, and bounding boxes
- **File Management**: Handle original PDF files and generated Excel outputs

### Development and Deployment
- **Build System**: Vite for frontend bundling with esbuild for backend compilation
- **Development**: Hot module replacement for frontend and TypeScript compilation for backend
- **Environment**: Development and production configurations with environment variable management
- **Code Quality**: TypeScript strict mode with comprehensive type checking

## External Dependencies

### Core Framework Dependencies
- **React Ecosystem**: React 18 with TypeScript, React DOM, and React Query for state management
- **Backend Framework**: Express.js with TypeScript support and ES module configuration
- **Database**: PostgreSQL via Neon Database with Drizzle ORM and Drizzle Kit for migrations

### UI and Styling
- **Component Library**: Radix UI primitives for accessible, unstyled components
- **Design System**: Shadcn/ui component collection with consistent styling patterns
- **CSS Framework**: Tailwind CSS with PostCSS and Autoprefixer for styling
- **Icons**: Lucide React for consistent iconography

### File Processing
- **Excel Generation**: XLSX library for creating and manipulating Excel files
- **File Upload**: Multer middleware for handling multipart form data and file uploads
- **Validation**: Zod for runtime type validation and schema definition

### Development Tools
- **Build Tools**: Vite for frontend development with React plugin support
- **TypeScript**: Strict type checking with custom path aliases and module resolution
- **Development Plugins**: Replit-specific plugins for error overlay, cartographer, and dev banner

### Session and Security
- **Session Management**: Express sessions with PostgreSQL session store via connect-pg-simple
- **Validation Middleware**: Express-validator for request validation and sanitization
- **File Security**: Multer configuration with file type restrictions and size limits

### Utility Libraries
- **Date Handling**: date-fns for date manipulation and formatting
- **Class Management**: clsx and class-variance-authority for conditional CSS classes
- **Routing**: Wouter for lightweight client-side routing without heavy dependencies
# ONYU - Virtual Try-On D2C Platform

## Overview

ONYU is a direct-to-consumer (D2C) apparel brand with a real-time virtual try-on feature. Users can see how T-shirts and hoodies look on their body through their camera using AI-powered pose detection. The platform includes a product catalog, shopping cart, size recommendations based on body measurements, and an admin panel for product management.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript, bundled using Vite
- **Styling**: TailwindCSS with shadcn/ui component library (New York style variant)
- **State Management**: TanStack React Query for server state, React Context for client state (cart, theme)
- **Routing**: Wouter (lightweight React router)
- **Pose Detection**: TensorFlow.js with MediaPipe Pose model for real-time body tracking

### Backend Architecture
- **Runtime**: Node.js with Express
- **API Design**: RESTful JSON API with Zod validation
- **Build System**: esbuild for server bundling, Vite for client

### Data Layer
- **Database**: MongoDB Atlas (document database)
- **Schema Validation**: Zod schemas in shared directory (used by both client and server)
- **Storage Interface**: MongoDB-based storage layer in `server/storage.ts` implementing IStorage interface

### Key Design Patterns
- **Shared Types**: TypeScript schemas defined in `shared/schema.ts` are used across frontend and backend
- **Path Aliases**: `@/` maps to client/src, `@shared/` maps to shared directory
- **Component Architecture**: Atomic design with reusable UI components in `client/src/components/ui/`

### Core Features
1. **Virtual Try-On Page** (`/try-on`): Camera-based garment overlay with pose detection
2. **Product Catalog** (`/products`): Grid display with category filtering
3. **Product Details** (`/product/:id`): Size/color selection with add-to-cart
4. **Shopping Cart**: Slide-out drawer with quantity management
5. **Admin Panel** (`/admin`): Product CRUD operations

### API Endpoints
- `GET /api/products` - List all products
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Create product
- `PATCH /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product
- Cart endpoints for session-based cart management

## External Dependencies

### Machine Learning / Computer Vision
- **TensorFlow.js** (`@tensorflow/tfjs`): Core ML framework for browser-based inference
- **MediaPipe Pose Detection** (`@tensorflow-models/pose-detection`): Body keypoint detection for garment overlay

### Database
- **MongoDB**: Document database with MongoDB Atlas cloud hosting
- **Collections**: `products` and `carts` in `virtualtryon` database
- **Connection**: Configured via `MONGODB_URI` environment secret

### UI Framework
- **Radix UI**: Headless component primitives (dialog, dropdown, tabs, etc.)
- **shadcn/ui**: Pre-built component library built on Radix
- **Lucide React**: Icon library

### Form Handling
- **React Hook Form**: Form state management
- **Zod**: Schema validation with `@hookform/resolvers` integration

### Styling
- **TailwindCSS**: Utility-first CSS framework
- **class-variance-authority**: Variant management for components
- **tailwind-merge** (via clsx): Class name merging utility
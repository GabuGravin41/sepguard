# SepsisGuard Clinical Dashboard

## Overview

SepsisGuard is a modern, responsive clinical dashboard designed to help healthcare professionals monitor patients for sepsis risk in real-time. The application provides comprehensive patient monitoring through vital sign tracking, lab result analysis, and automated risk assessment scoring. Built as a full-stack web application with a React frontend and Express backend, it features real-time data updates, intelligent alerting systems, and intuitive data visualization to support clinical decision-making.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The client application is built using React with TypeScript, leveraging modern UI patterns and component composition. The architecture employs a modular design with reusable components organized by functionality:

- **Component Structure**: Utilizes shadcn/ui component library for consistent design patterns, with custom components for domain-specific functionality like patient cards, vitals charts, and alert lists
- **State Management**: Implements TanStack Query (React Query) for server state management, providing automatic caching, background updates, and optimistic updates
- **Routing**: Uses Wouter for lightweight client-side routing without unnecessary complexity
- **Styling**: Adopts Tailwind CSS with CSS custom properties for theming, supporting both light and dark modes with a medical-focused color scheme (primary green, accent magenta)
- **Data Visualization**: Integrates Recharts for rendering time-series vital signs and trend analysis

### Backend Architecture
The server follows a RESTful API design pattern built on Express.js with TypeScript:

- **API Layer**: Clean REST endpoints organized by resource type (patients, vitals, labs, alerts, sensors)
- **Data Storage**: Uses Drizzle ORM with PostgreSQL for type-safe database interactions and schema management
- **Mock Data Layer**: Implements an in-memory storage interface for development and demonstration purposes, allowing rapid prototyping without database dependencies
- **Middleware**: Custom request logging and error handling for debugging and monitoring

### Database Design
PostgreSQL schema designed for clinical data with proper relationships and constraints:

- **Core Entities**: Patients, vitals, lab results, alerts, sensors, testing schedules, and alert settings
- **Data Integrity**: Foreign key relationships ensure data consistency across patient records
- **Temporal Data**: Timestamp-based tracking for vital signs and lab results enables trend analysis
- **Risk Scoring**: Computed sepsis risk scores (0-100) with trend indicators for clinical assessment

### Real-time Features
- **Automatic Refresh**: Configurable polling intervals for different data types (10s for alerts, 30s for vitals, 60s for schedules)
- **Live Updates**: Query invalidation patterns ensure UI reflects latest data changes
- **Progress Tracking**: Real-time testing schedule progress with visual indicators

### UI/UX Design Patterns
- **Glass Morphism**: Subtle transparency effects with backdrop blur for modern visual depth
- **Responsive Design**: Mobile-first approach with tablet and desktop optimizations
- **Accessibility**: High contrast modes, keyboard navigation, and screen reader support
- **Micro-interactions**: Hover effects, loading states, and smooth transitions for enhanced user experience

## External Dependencies

### Core Framework Dependencies
- **React 18+**: Frontend framework with hooks and concurrent features
- **Express.js**: Backend web framework for REST API
- **TypeScript**: Type safety across frontend and backend
- **Vite**: Fast development server and build tool with HMR

### Database & ORM
- **PostgreSQL**: Primary database for production data storage
- **Drizzle ORM**: Type-safe database toolkit with migrations
- **@neondatabase/serverless**: Serverless PostgreSQL adapter for cloud deployment

### UI & Styling
- **Tailwind CSS**: Utility-first CSS framework with custom design tokens
- **shadcn/ui**: High-quality React component library built on Radix UI primitives
- **Radix UI**: Unstyled, accessible UI primitives for custom component development
- **Recharts**: React charting library for data visualization

### Data Management
- **TanStack Query**: Server state management with caching and synchronization
- **React Hook Form**: Performant form library with validation
- **Zod**: TypeScript-first schema validation for runtime type checking

### Development Tools
- **Wouter**: Lightweight routing library for single-page applications
- **date-fns**: Modern date utility library for temporal data formatting
- **class-variance-authority**: Utility for creating variant-based component APIs

### Validation & Schemas
- **drizzle-zod**: Integration between Drizzle ORM and Zod for consistent validation
- **@hookform/resolvers**: Form validation resolvers for various schema libraries

All dependencies are carefully chosen to support the clinical dashboard requirements while maintaining performance, accessibility, and developer experience. The architecture supports both development with mock data and production deployment with real medical data systems.
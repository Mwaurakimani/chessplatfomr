# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Architecture

This is a chess platform application with a clean separation between frontend and backend:

- **Frontend**: React + TypeScript application using Vite as the build tool, located in `Frontend/`
- **Backend**: Node.js Express server using JavaScript ES modules, located in `Backend/`
- **Database**: PostgreSQL with some components using MongoDB (via Mongoose)

### Frontend Architecture

- **Framework**: React 18 with TypeScript and Vite
- **UI Library**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design system
- **State Management**: React Query (@tanstack/react-query) for server state
- **Routing**: React Router DOM for navigation
- **Real-time**: Socket.io client for live game features

### Backend Architecture

- **Server**: Express.js 5.x with ES modules
- **Database**: Dual database setup:
  - PostgreSQL for core game data (challenges, games)
  - MongoDB with Mongoose for additional features
- **Authentication**: JWT with bcrypt for password hashing
- **Real-time**: Socket.io server for live game communication
- **API**: RESTful endpoints with async/await error handling

## Development Commands

### Frontend (run from `Frontend/` directory)
- `npm run dev` - Start development server with hot reload
- `npm run build` - Production build
- `npm run build:dev` - Development build
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

### Backend (run from `Backend/` directory)
- `npm run start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm run db:init` - Initialize database schema
- `node migrate.js` - Run database migrations

## Database Management

### PostgreSQL Setup
The application uses PostgreSQL as the primary database. Connection details are typically:
- Host: localhost
- Port: 5432
- Database: chess_platform
- Credentials: Configured via environment variables

### Migration System
- Database migrations are handled through standalone scripts (`migrate.js`, `migrate2.js`)
- Migrations add columns like `time_control`, `rules`, and `updated_at` to existing tables
- Always run migrations before starting the application after schema changes

### Models
- **Challenge**: Chess game challenges with time controls and rules
- **Game**: Completed chess games with results
- **User**: User authentication and profile data

## Key File Structure

```
Frontend/
├── src/
│   ├── components/
│   │   ├── ui/           # shadcn/ui components
│   │   ├── HeaderMenu.tsx
│   │   └── ProtectedRoute.tsx
│   ├── pages/            # Route components
│   ├── hooks/            # Custom React hooks
│   └── lib/utils.ts      # Utility functions
├── components.json       # shadcn/ui configuration
└── package.json

Backend/
├── controllers/          # Route handlers
├── routes/              # Express route definitions  
├── models/              # Database models
├── middleware/          # Express middleware
├── config/              # Configuration files
├── db/                  # Database utilities
└── package.json
```

## Important Technical Details

### Socket.io Integration
Both frontend and backend use Socket.io version 4.8.1 for real-time features. The client connects to the backend server for live game updates.

### Authentication Flow
- JWT tokens for session management
- Protected routes using ProtectedRoute component on frontend
- Express middleware for API authentication on backend

### Environment Configuration
- Frontend proxy configured to `http://localhost:3001` for API calls
- Backend typically runs on port 3001
- Environment variables managed through dotenv

### TypeScript Configuration
- Frontend uses strict TypeScript with Vite
- Backend uses JavaScript ES modules (no TypeScript compilation needed)
- Type checking available via `@types/node` and other type packages

## Development Workflow

1. Start PostgreSQL database
2. Run any pending migrations: `cd Backend && node migrate.js`
3. Start backend: `cd Backend && npm run dev`
4. Start frontend: `cd Frontend && npm run dev`
5. Frontend will be available at `http://localhost:5173` (Vite default)
6. Backend API available at `http://localhost:3001`

## Testing and Linting

- Frontend linting: `cd Frontend && npm run lint`
- No automated tests currently configured
- ESLint configuration includes React hooks and TypeScript rules
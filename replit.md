# DriveEase - Car Rental Platform

## Overview

DriveEase is a comprehensive car rental platform inspired by Zoomcar, built as a full-stack web application. The platform connects car owners with renters through a secure, user-friendly interface that handles the entire rental lifecycle - from browsing and booking to payments and reviews.

The application supports three distinct user roles (regular users, car owners, and administrators), each with tailored dashboards and functionality. Users can browse available vehicles with advanced filtering, make bookings with integrated payment processing, and leave reviews. Car owners can list and manage their fleet while tracking revenue and bookings. Administrators have oversight of the entire platform with comprehensive analytics.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack**: React 18 with TypeScript, built using Vite as the bundler. The application uses Wouter for client-side routing instead of React Router.

**UI Framework**: Shadcn/ui component library with Radix UI primitives, styled using Tailwind CSS. The design system follows a "New York" style configuration with custom theming for light/dark modes. Typography uses Inter for UI elements and Poppins for headings, loaded from Google Fonts.

**State Management**: TanStack Query (React Query) handles all server state management, with a centralized query client configuration. Local component state uses React hooks. No global state management library (Redux, Zustand, etc.) is implemented.

**Design System**: Custom design guidelines documented in `design_guidelines.md` provide spacing primitives, typography scales, grid patterns, and component specifications. The system draws inspiration from Zoomcar, Airbnb, and other booking platforms.

**Component Structure**: 
- Reusable UI components in `client/src/components/ui/` (shadcn components)
- Feature components in `client/src/components/` (CarCard, BookingWidget, ReviewList, etc.)
- Role-specific dashboard components (UserDashboard, OwnerDashboard, AdminDashboard)
- Page components in `client/src/pages/`

### Backend Architecture

**Server Framework**: Express.js with TypeScript running on Node.js. The server follows a modular structure with separation of concerns.

**API Design**: RESTful API endpoints organized by resource (cars, bookings, payments, reviews). All endpoints return JSON responses and follow consistent error handling patterns.

**Authentication**: Replit's OpenID Connect (OIDC) authentication system using Passport.js strategy. Session management uses express-session with PostgreSQL-backed session storage (connect-pg-simple). The authentication flow includes:
- OAuth2/OIDC discovery and token management
- Session persistence in database
- Role-based access control (user, owner, admin)
- Protected API routes requiring authentication

**Database Access Layer**: The `storage.ts` module provides an abstraction layer over direct database queries, implementing the repository pattern. All database operations go through this interface, making the codebase more maintainable and testable.

**Request Flow**:
1. Client makes API request with credentials (cookies)
2. Express middleware validates session
3. Route handler uses storage layer for database operations
4. Response sent back to client as JSON

### Data Storage Solutions

**Database**: PostgreSQL via Neon's serverless PostgreSQL driver (@neondatabase/serverless). The connection uses WebSocket protocol for serverless compatibility.

**ORM**: Drizzle ORM for type-safe database queries and schema management. Schema defined in `shared/schema.ts` and shared between client and server for type consistency.

**Schema Structure**:
- `users`: User profiles with role-based access (user/owner/admin), includes government ID verification
- `cars`: Vehicle listings with owner relationship, pricing, specifications, images, and availability
- `bookings`: Rental reservations linking users to cars with date ranges and status tracking
- `payments`: Payment records tied to bookings with status and amount tracking
- `reviews`: User feedback with ratings (1-5 stars) and owner responses
- `sessions`: Session storage for authentication (required by Replit Auth)

**Database Migrations**: Managed through Drizzle Kit with migrations stored in `/migrations` directory. Push-based deployment using `db:push` command for development.

**Schema Validation**: Zod schemas generated from Drizzle schema using drizzle-zod for runtime validation of API inputs.

### Authentication and Authorization

**Provider**: Replit's built-in OIDC authentication system, eliminating need for custom user registration/login flows.

**Session Management**: 
- Server-side sessions stored in PostgreSQL
- 7-day session TTL (time to live)
- Secure, HTTP-only cookies
- Session data includes user claims, access tokens, refresh tokens

**User Model**: Extended beyond basic OIDC claims to include:
- Role assignment (user/owner/admin)
- Government ID for verification (Aadhaar/PAN simulation)
- Profile metadata (first name, last name, profile image)

**Access Control**:
- Route-level protection using `isAuthenticated` middleware
- Role-based UI rendering (different dashboards per role)
- API endpoints check user roles before performing operations
- Owner-specific endpoints verify ownership of resources (e.g., only car owners can edit their cars)

**Security Measures**:
- CSRF protection through same-origin policy
- Secure cookie flags enabled in production
- Token refresh logic to maintain active sessions
- User verification through government ID field

### External Dependencies

**Neon Database**: Serverless PostgreSQL hosting service. Uses WebSocket connections for compatibility with serverless environments. Environment variable `DATABASE_URL` must be configured.

**Replit Authentication Service**: OIDC provider accessed via `ISSUER_URL` (defaults to https://replit.com/oidc). Requires `REPL_ID` and `SESSION_SECRET` environment variables.

**Google Fonts**: External CDN for Inter and Poppins font families loaded in the HTML head.

**Payment Gateway**: Booking flow includes payment processing logic, designed to integrate with services like Razorpay or Paytm (currently mock implementation in frontend).

**Image Storage**: Car images stored as URL strings in database. The application uses pre-generated placeholder images from `attached_assets/generated_images/` directory for demo cars. Production would require integration with cloud storage (S3, Cloudinary, etc.).

**Development Tools**:
- Vite plugins for Replit integration (cartographer, dev-banner, runtime-error-modal)
- WebSocket library (ws) for Neon database connections
- PostCSS and Autoprefixer for CSS processing

**Third-Party UI Libraries**:
- Radix UI primitives for accessible components
- Lucide React for icons
- date-fns for date manipulation
- react-day-picker for calendar widgets
- cmdk for command palette patterns
- embla-carousel-react for image carousels
# Invertar - Inventory Management System

Invertar is a TypeScript monorepo for an inventory management system with organizations, users, folders, and items. It consists of a Fastify API server, SvelteKit web application, and shared packages for database, authentication, and types.

Always reference these instructions first and fallback to search or bash commands only when you encounter unexpected information that does not match the info here.

## Working Effectively

### Initial Setup
- Install Node.js v20+ and pnpm:
  - `npm install -g pnpm@10.13.1`
- Install dependencies:
  - `pnpm install` -- takes ~30 seconds. NEVER CANCEL. Set timeout to 120+ seconds.
- Set up environment variables by creating a `.env` file in the root directory with these required variables:
  ```
  DATABASE_URL="postgresql://username:password@host:port/database"
  JWT_SECRET="your_jwt_secret_key"
  SUPERADMIN_USERNAME="admin"
  SUPERADMIN_PASSWORD="secure_password"
  SUPERADMIN_ORGANIZATION="YourOrg"
  ADMIN_USERNAME="admin_user"
  ADMIN_PASSWORD="admin_password"
  ADMIN_ORGANIZATION="AdminOrg"
  ADMIN_EMAIL="admin@example.com"
  ```

### Database Setup (Required for Full Functionality)
- **CRITICAL**: Most build and test operations require a PostgreSQL database and Prisma client generation
- Generate Prisma client (requires internet access):
  - `pnpm prisma:generate` -- may fail in restricted environments due to Prisma binary downloads
  - If this fails, database-dependent operations will not work
- Run database migrations:
  - `pnpm prisma:migrate:dev` -- for development
  - `pnpm prisma:migrate:deploy` -- for production
- Seed the database:
  - `pnpm db:seed` -- creates initial superadmin user

### Build and Development
- **CANNOT RUN FULL BUILDS WITHOUT DATABASE**: TypeScript compilation fails without Prisma client
- Individual package builds that work without database:
  - `cd packages/auth && pnpm build` -- compiles authentication utilities
  - `cd packages/types && pnpm build` -- types are source-only, no compilation needed
- Run development servers:
  - API server: `pnpm dev:api` -- starts Fastify server on port 3000 (requires database)
  - Web app: `pnpm dev:web` -- starts SvelteKit dev server (requires API server)

### Testing
- **CRITICAL**: Tests require database setup and environment variables
- Run all tests:
  - `pnpm test` -- runs Vitest tests, requires database connection. NEVER CANCEL. Set timeout to 300+ seconds.
- Test files located in `tests/api/e2e/` directory

### Linting and Formatting
- **KNOWN ISSUES**: The codebase currently has linting errors that must be addressed:
  - Web app linting: `cd apps/web && pnpm lint` -- fails with 8 TypeScript errors (no-explicit-any, unused vars)
  - Format code: `cd apps/web && pnpm format` -- fixes formatting issues
  - Svelte check: `cd apps/web && pnpm check` -- fails due to missing Prisma client

### CI/CD Validation
- **ALWAYS** ensure your changes pass CI requirements:
  - TypeScript type checking: `pnpm typecheck` -- requires Prisma client generation
  - All linting must be fixed before CI passes
  - Tests must pass with proper environment variables

## Repository Structure

### Applications
- `apps/api/` - Fastify API server with tRPC endpoints
- `apps/web/` - SvelteKit web application with Tailwind CSS

### Shared Packages
- `packages/db/` - Prisma database schema and client
- `packages/auth/` - JWT and password hashing utilities  
- `packages/types/` - Shared TypeScript types and Zod schemas

### Key Files
- `pnpm-workspace.yaml` - Workspace configuration
- `vitest.config.ts` - Test configuration with global setup
- `.github/workflows/ci.yml` - CI pipeline configuration

## Validation Scenarios
- **CANNOT FULLY VALIDATE WITHOUT DATABASE**: Most functionality depends on PostgreSQL database
- When database is available, test these user flows:
  - User registration and login
  - Organization and folder management
  - Item creation and management
  - Admin user management (super admin dashboard)

## Common Issues and Limitations
- **Prisma client generation may fail** in environments without internet access to download binaries
- **Build commands fail** without successful Prisma client generation
- **Existing linting errors** prevent clean CI runs - these should be fixed
- **Database dependency** - most operations require PostgreSQL connection
- **Environment variables required** - see setup section for complete list

## Development Workflows

### Making Changes
1. Always ensure database is set up and Prisma client is generated
2. Run `pnpm typecheck` to validate TypeScript (requires database)
3. Test changes with `pnpm test` (requires database and long timeout)
4. Fix linting with `cd apps/web && pnpm format && pnpm lint`
5. Validate web app with `cd apps/web && pnpm check`

### Time Expectations
- Dependency installation: ~30 seconds
- Prisma client generation: varies (may fail in restricted environments)  
- TypeScript checking: ~4 seconds (with Prisma client)
- Tests: May take several minutes - NEVER CANCEL, use 300+ second timeouts
- Web app linting: ~8 seconds
- Web app formatting: ~1 second

## Key Technologies
- **Backend**: Fastify, tRPC, Prisma, PostgreSQL, JWT authentication
- **Frontend**: SvelteKit, Tailwind CSS, TypeScript
- **Build**: Vite, TypeScript, pnpm workspaces
- **Testing**: Vitest with global setup
- **Linting**: ESLint, Prettier, svelte-check
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
- **PARTIAL BUILD CAPABILITY**: Some builds work without database, others fail
- **Web application CAN be built** without database:
  - `cd apps/web && pnpm build` -- takes ~19 seconds, builds successfully. NEVER CANCEL. Set timeout to 60+ seconds.
  - Builds include SSR bundle, client bundle, and package creation
- Individual package builds that work without database:
  - `cd packages/auth && pnpm build` -- compiles authentication utilities (~1 second)
  - `cd packages/types && pnpm build` -- types are source-only, no compilation needed
- **CANNOT BUILD API** without database: Fails with "Cannot find module '.prisma/client/default'"
- Run development servers:
  - API server: `pnpm dev:api` -- **FAILS** without Prisma client generation
  - Web app: `pnpm dev:web` -- starts successfully on port 5173, but functionality limited without API

### Testing
- **CRITICAL**: Tests require database setup and Prisma client generation
- **CANNOT RUN TESTS** without database: Fails with "Cannot find module '.prisma/client/default'"
- Run all tests:
  - `pnpm test` -- **FAILS** without database connection, requires Prisma client. NEVER CANCEL. Set timeout to 300+ seconds when database is available.
- Test files located in `tests/api/e2e/` directory
- Global test setup in `tests/setup-global.ts` handles database seeding for tests

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
- **LIMITED VALIDATION WITHOUT DATABASE**: Only web app builds can be validated
- **CANNOT FULLY VALIDATE WITHOUT DATABASE**: Most functionality depends on PostgreSQL database
- When database is available, test these user flows:
  - User registration and login
  - Organization and folder management
  - Item creation and management
  - Admin user management (super admin dashboard)
- **PARTIAL VALIDATION POSSIBLE**: 
  - Web app can be built and dev server started (on port 5173)
  - Individual package builds can be tested
  - Linting and formatting can be validated

## Common Issues and Limitations
- **Prisma client generation may fail** in environments without internet access to download binaries from binaries.prisma.sh
- **Build commands fail** without successful Prisma client generation (except web app)
- **Dev servers fail** without Prisma client (API server fails immediately, web starts but has no backend)
- **Tests completely fail** without Prisma client and database connection
- **Database seeding fails** without Prisma client generation
- **Existing linting errors** prevent clean CI runs - these should be fixed
- **Database dependency** - most operations require PostgreSQL connection
- **Environment variables required** - see setup section for complete list

## Troubleshooting
- **"Cannot find module '.prisma/client/default'"**: Prisma client not generated - network access required
- **API dev server fails immediately**: Missing Prisma client generation
- **Tests show "No test files found" then error**: Missing Prisma client prevents test setup
- **TypeScript errors on db imports**: Prisma client must be generated first
- **Long timeouts needed**: Build and test operations can take several minutes - use 60+ second timeouts for builds, 300+ for tests

## Development Workflows

### Making Changes
1. Always ensure database is set up and Prisma client is generated
2. Run `pnpm typecheck` to validate TypeScript (requires database)
3. Test changes with `pnpm test` (requires database and long timeout)
4. Fix linting with `cd apps/web && pnpm format && pnpm lint`
5. Validate web app with `cd apps/web && pnpm check`

### Time Expectations
- Dependency installation: ~31 seconds
- Prisma client generation: varies (may fail in restricted environments due to binary downloads from binaries.prisma.sh)  
- TypeScript checking: ~4 seconds (with Prisma client), fails without it
- Tests: **CANNOT RUN** without database - NEVER CANCEL, use 300+ second timeouts when database available
- Web app build: ~19 seconds - works without database
- Web app linting: ~8 seconds 
- Web app formatting: ~1 second
- Individual package builds: ~1 second each

## Key Technologies
- **Backend**: Fastify, tRPC, Prisma, PostgreSQL, JWT authentication
- **Frontend**: SvelteKit, Tailwind CSS, TypeScript
- **Build**: Vite, TypeScript, pnpm workspaces
- **Testing**: Vitest with global setup
- **Linting**: ESLint, Prettier, svelte-check
# Invertar - Inventory Management System

Invertar is a full-stack TypeScript monorepo for inventory management, consisting of a Fastify+tRPC API backend and a SvelteKit frontend. The application manages organizations, users, folders, items, and photos in a multi-tenant architecture.

**ALWAYS reference these instructions first and fallback to search or bash commands only when you encounter unexpected information that does not match the info here.**

## Working Effectively

### Initial Setup and Dependencies
- **CRITICAL**: Install pnpm globally first: `npm install -g pnpm@10.13.1`
- Install dependencies: `pnpm install` -- takes 2-30 seconds. NEVER CANCEL.
- Set timeout to 60+ seconds for pnpm install.

### Environment Setup
- **REQUIRED**: Create `.env` file in repository root with these variables:
```
#DATABASE - Running PostgreSQL instance
DATABASE_URL="postgresql://username:password@localhost:5432/invertar"

JWT_SECRET="your_jwt_secret_here"

#API
BASE_URL="http://localhost:3000"


# NEEDED FOR TESTING - These users can be seeded into the db with `pnpm db:seed:test-users`
SUPERADMIN_USERNAME="superadmin"
SUPERADMIN_PASSWORD="Superadmin123@admin"
SUPERADMIN_ORGANIZATION="SYSTEM"

ADMIN_USERNAME="admin"
ADMIN_PASSWORD="Admin123@admin"
ADMIN_ORGANIZATION="TEST"
ADMIN_EMAIL="admin@example.com"

USER_USERNAME="user"
USER_PASSWORD="User123@user"
USER_ORGANIZATION="TEST"
```

The DATABASE_URL & JWT_SECRET are placeholders, create them yourself.
You will need an actual postgresql database running, spin it up using docker or any other method.
The users can be seeded into the database using the provided seed scripts - `pnpm db:seed:test-users`

### Database Setup
- Install PostgreSQL: `sudo apt-get update && sudo apt-get install -y postgresql postgresql-contrib`
- Start PostgreSQL: `sudo service postgresql start`
- Create database user: `sudo -u postgres createuser -s <username>`
- Create database: `sudo -u postgres createdb -O <username> invertar`
- **CRITICAL LIMITATION**: Prisma client generation fails in sandboxed environments due to binary download restrictions. The database and API cannot function without Prisma client generation. Propose solutions.

### Building and Development

#### TypeScript Validation
- **Run typecheck**: `pnpm typecheck` -- takes 4 seconds but fails due to Prisma client issues
- Expect Prisma-related TypeScript errors in packages/db/ until client is generated
- 
#### Buildng and Running Web Application (SvelteKit)
- **Run development server**: `pnpm dev:web` -- starts in 2 seconds on http://localhost:5173
- **Build for production**: `cd apps/web && pnpm build` -- takes 18 seconds. NEVER CANCEL. Set timeout to 2+ minutes.
- **Lint code**: `cd apps/web && pnpm lint` -- takes 2 seconds
- **Format code**: `cd apps/web && pnpm format` -- takes 1.4 seconds

#### Web Application (SvelteKit) - Development Guideline
- Follow the established design system and component library.
- Ensure accessibility best practices are followed.
- Maintain consistent spacing, typography, and color usage (for buttons, labels, and other UI elements).
- The UI needs to be beautiful :))) 
- Color palettes, gradients, and overall aesthetics should be considered in all components (see `apps/web/src/routes/dashboard/+page.svelte` for examples).
- Reuse existing components and patterns (or create new ones) to maintain consistency. - DRY!

#### Building and Running API Application (Fastify + tRPC)
- **LIMITATION**: `pnpm dev:api` fails without Prisma client generation
- **Run development server**: `pnpm dev:api` -- requires working Prisma client
- API runs on port 3000 when functional

#### API Application (Fastify + tRPC) - Development Guideline
- Reuse existing components and patterns (or create new ones) to maintain consistency. - DRY!

### Testing
- **Run API tests**: `pnpm test:api` -- FAILS without Prisma client generation
- Tests are located in `tests/api/e2e/` directory
- Tests require database setup and environment variables

- **Run UI tests**: `pnpm test:web`
- Tests are located in `tests/web/` directory
- Tests require database setup and environment variables

## Validation Scenarios

### Web Application Validation
**ALWAYS test these scenarios after making changes to the web app:**

1. **Basic Application Start**: 
   - Run `pnpm dev:web`
   - Navigate to http://localhost:5173
   - Verify login page displays with Invertar branding
   - Verify form fields: Organization Name, Username, Password
   - Take screenshot to confirm UI renders correctly

2. **Build Validation**:
   - Run `cd apps/web && pnpm build`
   - Verify build completes without errors (warnings are acceptable)
   - Check that build artifacts are created in `.svelte-kit/output/`

3. **Code Quality**:
   - Run `cd apps/web && pnpm format` to format code
   - Run `cd apps/web && pnpm lint` and fix any critical errors

### API Application Validation (Limited)
**LIMITATION**: Full API validation impossible without Prisma client generation

1. **Attempted API Start**:
   - Run `pnpm dev:api` 
   - Expect failure with Prisma client error
   - Document that database setup is required for full functionality

## Testing Strategy
Focus on E2E testing.

1. **API E2E Testing**
   - Reside in `tests/api/e2e/`
   - Use Vitest for API tests.
   - Focus on testing business logic and data validation.
   - Write tests for all procedures and their expected behaviors.
   - SUPER_ADMIN, ADMIN, USER users (from .env) can be seeded into the db with `pnpm db:seed:test-users`, assume they already exist and reuse them in the tests where the corresponding actors / user roles are needed.
   - New users can be created if necessary for validating user creation scenarios, but when a user actor is needed in a test, use the existing users from the .env.
   - When creating new users create them with unique usernames and emails (to avoid conflicts) and on behalf of the provided ADMIN , SUPER ADMIN users and their organizations (since those can be purged from the db with a script) and via the trpc procedures - there is a getToken utility in `tests/api/e2e/config/config.ts` for obtaining the necessary tokens with user roles.
   - Created users & organizations can be deleted after the tests are done to maintain a clean database (when using a persistent database on the TEST environment) with `pnpm db:purge:test-users`.
   - To save test run time, DO NOT add clean up for the created users and organizations in beforeAll/ afterAll hooks, assume they will be purged from the database before the test are started or after they have finished.
   - When generating test data, use the `faker` library to create unique usernames, emails and so on.
   - Use existing config from `tests/api/e2e/config/config.ts`
   - Do NOT add any additional libraries like `supertest` or `axios` or `fetch`, the `req` function in `tests/api/e2e/config/config.ts` should be used for making requests.
   - Create hooks and fixtures when needed and reuse them - DRY!

2. **UI E2E Testing**: Simulate real user scenarios from start to finish.
   - Reside in `tests/web/`
   - Use Playwright for E2E tests in the web application.
   - Ensure all critical user journeys are covered.
   - SUPER_ADMIN, ADMIN, USER users (from .env) can be seeded into the db with `pnpm db:seed:test-users`, assume they already exist and reuse them in the tests where the corresponding user roles/ actors are needed.
   - New users can be created if necessary for validating user creation scenarios, but when a user actor is needed in a test, use the existing users from the .env.
   - When creating new users, create them with unique usernames and emails (to avoid conflicts) and on behalf of the provided ADMIN/ SUPER ADMIN users and their organizations and via the UI or the trpc procedures.
   - Created users & organizations can be deleted after the tests are done, to maintain a clean database (when using a persistent database on the TEST environment) with `pnpm db:purge:test-users`.
   - To save test run time, DO NOT add clean up for the created users and organizations in beforeAll/ afterAll hooks, assume they will be purged from the database before the test are started or after they have finished.
   - When generating test data, use the `faker` library to create unique usernames, emails and so on.
   - Reuse existing fixtures from `tests/web/fixtures` or create new ones - DRY!
   - Never invent or hallucinate web element locators in playwright, instead make sure locator strategies exist first and if not, create the locators directly in the svelte files. Use id, name, or data attributes.
   - Never use the svelte class names as locator strategies - since they can change frequently and are not reliable.
   - Use meaningful and descriptive names for locators to improve readability and maintainability.
   - Never invent success/ error messages, toasts, etc. - check the actual strings from the html and use them in your tests.

Create unit and integration tests when appropriate.

## Known Issues and Limitations

### Prisma Client Generation
- **CRITICAL ISSUE**: `pnpm --filter db exec prisma generate` fails in sandboxed environments
- **Root Cause**: Cannot download Prisma binaries from binaries.prisma.sh
- **Impact**: API, tests, and database operations are non-functional
- **Workaround**: None available in sandboxed environments
- **Solution**: Run in environment with internet access to Prisma CDN

### TypeScript Errors
- TypeScript compilation fails due to missing Prisma client types
- Errors in `packages/db/index.ts` and `packages/db/seed.ts`
- Web application TypeScript builds successfully despite API type issues

### Testing
- All tests fail due to missing Prisma client
- API Test setup in `tests/api/setup-global.ts` requires database connection
- API E2E tests in `tests/api/e2e/` test authentication and admin creation flows
- UI E2E tests in `tests/web/` test user interactions and visual elements

## Project Structure

### Repository Layout
```
├── apps/
│   ├── api/          # Fastify + tRPC API server
│   └── web/          # SvelteKit frontend application  
├── packages/
│   ├── auth/         # Authentication utilities (bcrypt, JWT)
│   ├── db/           # Prisma schema and database client
│   └── types/        # Shared TypeScript types and schemas
├── tests/            # Application tests
└── .env              # Environment variables (create manually)
```
NEVER move, rename, or restructure folders unless I explicitly instruct.

### Key Technologies
- **Frontend**: SvelteKit + TypeScript + TailwindCSS
- **Backend**: Fastify + tRPC + TypeScript
- **Database**: PostgreSQL + Prisma ORM
- **Package Manager**: pnpm with workspaces
- **Testing: API**: Vitest
- **Testing: Web**: Playwright
- **Build**: Vite

Copilot, do not propose technologies outside: Fastify, tRPC, Prisma, PostgreSQL, SvelteKit, Tailwind, Playwright, Vitest, pnpm. Never substitute alternatives unless I explicitly request.

### Database Schema
- **Organizations**: Multi-tenant organization support
- **Users**: Username/password auth with roles (SUPER_ADMIN, ADMIN, USER)
- **Folders**: Inventory organization containers
- **Items**: Inventory items with name, description, price, quantity
- **Photos**: Image attachments for items and folders

## Common Development Tasks

### Making Changes
1. **Always start with**: `pnpm install` and environment setup
2. **For web changes**: Test with `pnpm dev:web` and validate in browser
3. **Before committing**: Run `cd apps/web && pnpm format && pnpm lint`
4. **Test builds**: Run `cd apps/web && pnpm build` to verify production build

### Debugging Issues
- **Web app won't start**: Check that pnpm is installed and dependencies are current
- **API won't start**: Expect Prisma client errors - this is a known limitation
- **TypeScript errors**: Focus on web app errors; API errors are expected without Prisma
- **Build failures**: Usually related to TypeScript issues in the web app

### Performance Expectations
- **pnpm install**: 2-30 seconds depending on cache
- **Web dev server start**: 2 seconds  
- **Web production build**: 18 seconds
- **TypeScript check**: 4 seconds
- **Code formatting**: 1-2 seconds

## Users, flows, Business Logic, etc
- The Super admin is the master of the app, his main jobs is to create/manage Admins, organizations, and settings -  he does not have an email - he doesn't need one - he will be seeded into the DB once the app is live. He will not create/ manage items and folders and inventory - he just gives initial access to Admins.
- The Admin can manage users and their permissions within the organization. They need an email to which the Super Admin will communicate in case of any problems. The rest of capabilities are the same as the Users.
- The User can manage their own profile and data. Can create and manage folders and inventory items (based on their permissions) within their organization. 
- The User doesn't need an email, since the Admin of the organization will manage him. They will use other means of communications that are already established withing their organization and it is not a concern for Invertar.
- The Business logic is more or less defined in the db schema - packages\db\schema.prisma, but it is not set in stone and will evolve as the application grows.

## FINAL NOTES 
- I (rrradev, the human owner) will test all changes thoroughly before merging.
- I (rrradev) will provide further instructions during development. Always wait for explicit instructions before making structural or architectural changes.
- There is a CI workflow at `.github/workflows/ci.yml` with mandatory checks on all PRs.

Never modify `.github/workflows/ci.yml` unless explicitly requested.

**NEVER CANCEL** any build or test commands. Builds may take longer in different environments.

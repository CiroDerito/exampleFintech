# Copilot Instructions for AI Agents

## Overview
This project is a NestJS (Node.js + TypeScript) backend, structured for modularity and scalability. It uses TypeORM for database access and integrates with external services like Sentry for error tracking and Supabase (PostgreSQL) for persistent storage.

## Architecture
- **Entry Point:** `src/main.ts` bootstraps the NestJS app, loads environment variables, and sets up Sentry and global validation pipes.
- **Modules:** Each domain (e.g., users) is organized as a NestJS module under `src/modules/`. Example: `src/modules/users/` contains controller, service, entity, and DTOs for user management.
- **Database:** TypeORM is configured asynchronously via `src/config/db.config.ts`, using environment variables. Entities are defined in `src/modules/[module]/entities/`.
- **Error Handling:** All exceptions are globally filtered and reported to Sentry via `src/filters/all-exceptions.filter.ts`.
- **Configuration:** Uses `@nestjs/config` for environment management. The `.env` file is expected at the project root.

## Developer Workflows
- **Install dependencies:** `npm install`
- **Run in development:** `npm run start:dev`
- **Run in production:** `npm run start:prod`
- **Run tests:** `npm run test` (unit), `npm run test:e2e` (end-to-end)
- **Test coverage:** `npm run test:cov`

## Project Conventions
- **Modules:** Place all new features in their own module under `src/modules/`.
- **DTOs:** Use DTOs for all request validation, located in `src/modules/[module]/dto/`.
- **Entities:** Place TypeORM entities in `src/modules/[module]/entities/`.
- **Error Reporting:** Use Sentry for all error and exception reporting.
- **Environment Variables:** Always access configuration via `process.env` or `@nestjs/config`.
- **ID Types:** User IDs are UUID strings (not integers) in Supabase/PostgreSQL. Ensure entity definitions use `@PrimaryGeneratedColumn('uuid')` for IDs.

## Integration Points
- **Database:** PostgreSQL (Supabase) via TypeORM. Connection details are loaded from `.env`.
- **Sentry:** Error and exception tracking is initialized in `main.ts` and used throughout services and filters.

## Examples
- **Creating a user:** Send a POST to `/users` with a JSON body matching `CreateUserDto`.
- **Fetching a user:** Send a GET to `/users/:id` where `id` is a UUID string.

## Key Files
- `src/main.ts` — App bootstrap, Sentry, validation
- `src/app.module.ts` — Root module, imports config, TypeORM, and feature modules
- `src/config/db.config.ts` — TypeORM async config
- `src/filters/all-exceptions.filter.ts` — Global error filter
- `src/modules/users/` — User module (controller, service, entity, DTO)

## Special Notes
- If you encounter 404s on routes, verify module and controller registration in `app.module.ts` and `[feature].module.ts`.
- Always restart the server after changing module or controller files.
- For new modules, use `nest g module <name>` and follow the existing structure.

# Clean Architecture Reference for Antigravity

## Core Tenet: Dependency Inversion
The fundamental rule of Clean Architecture is that **dependencies only point inward toward higher-level policies**.

```
[ External Interfaces: Web, CLI, Database, Devices ]
                    ↓
        [ Adapters / Presenters / Gateways ]
                    ↓
             [ Use Cases / Services ]
                    ↓
          [ Entities / Domain Models ]
```

## Directory Mapping in Next.js Modular Monolith
In the Tappzio project, Clean Architecture is realized as follows:
- `Entities & Domain Models`: Pure TypeScript types and business validation rules in `src/modules/<domain>/domain/`.
- `Use Cases & Application Services`: Orchestration functions in `src/modules/<domain>/services/` accepting ports/interfaces.
- `Adapters & Persistence`: Drizzle ORM repositories and Redis clients in `src/modules/<domain>/data/` or `src/db/`.
- `Presentation`: Next.js App Router handlers (`src/app/`) and UI components (`src/components/`).


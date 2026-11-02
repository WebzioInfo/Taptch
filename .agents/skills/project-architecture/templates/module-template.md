# Domain Module Architecture Template

Every new domain module in `src/modules/<domain>/` must adhere to this structure:

```
src/modules/<domain>/
├── index.ts              # Public API surface of the module (exports types, services, guards)
├── types.ts              # Domain entities, input schemas, and value types
├── errors.ts             # Domain-specific typed error classes (subclassing Error)
├── services/             # Application services executing use cases
│   └── <usecase>.service.ts
├── data/                 # Database queries, repositories, and cache operations
│   └── <entity>.repository.ts
└── __tests__/            # Co-located unit and integration tests (or under tests/)
    └── <domain>.test.ts
```

## Anti-Pattern Checklist
- ❌ Do NOT import internal files from another module (e.g. `import from '@/modules/cards/data/internal.ts'`).
- ✅ ALWAYS import via the public module boundary (`import { claimCard } from '@/modules/cards'`).


# Antigravity Agent Configuration & Discovery Guide

## 1. Overview

This document specifies the exact configuration and discovery mechanisms utilized by **Antigravity** (and Claude Code / Gemini Code Assist) within the Tapzio repository.

---

## 2. Directory Hierarchy & Conventions

```text
d:\Webzio\Tapzio\
├── AGENTS.md                  # Authoritative workspace governance rules & all-skills mandate
├── skills-lock.json           # Cryptographic integrity manifest for all 44 skills
├── .agents/
│   ├── rules/                 # Permanent behavioral and engineering rules
│   │   ├── 00-core-engineering.md
│   │   ├── 01-architecture-governance.md
│   │   ├── 02-code-quality.md
│   │   ├── 03-security-standards.md
│   │   ├── 04-testing-standards.md
│   │   ├── 05-project-continuity.md
│   │   ├── 06-documentation-standards.md
│   │   ├── 07-mandatory-all-skills-policy.md
│   │   ├── 08-ui-ux-standards.md
│   │   ├── 09-nextjs-standards.md
│   │   ├── 10-react-standards.md
│   │   └── 11-typescript-standards.md
│   │
│   └── skills/                # 44 single-level skill folders
│       ├── nextjs-app-router/
│       │   └── SKILL.md
│       ├── digital-profile-engine/
│       │   └── SKILL.md
│       └── ... (42 other skills)
│
└── (Canonical location: .agents/skills/ — original staging backed up to external archive)
```

---

## 3. Skill Discovery Mechanics

Antigravity scans `.agents/skills/` at the start of every session:
1. **Single-Level Directory Constraint**: Each skill must be placed in a top-level directory under `.agents/skills/<skill-name>/` containing a `SKILL.md` file. Nested categories (e.g. `.agents/skills/nextjs/app-router/`) are **NOT** automatically discovered by Antigravity's native loader.
2. **YAML Frontmatter Specification**:
   ```yaml
   ---
   name: skill-name
   description: "Actionable summary of capabilities and triggers."
   risk: safe
   source: tapzio-core
   date_added: "2026-11-02"
   version: "1.0.0"
   ---
   ```
3. **References & Sub-Resources**: Sub-resources (e.g. `reference/`, `scripts/`, `examples/`) reside inside the individual skill's folder (e.g. `.agents/skills/impeccable/reference/`).

---

## 4. Mandatory All-Skills Policy Enforcement

At the start of **every** turn:
1. Agent locates `.agents/skills/`.
2. Discovers all 44 `SKILL.md` files.
3. Reads and evaluates instructions.
4. Includes the mandatory **Skills Compliance Summary** in its final response.
5. Verifies that `package-lock.json` and `skills-lock.json` are synchronized.


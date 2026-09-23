# Valence Frontend

Canvas-first AI workflow builder for the Valence platform. Built with React, TypeScript, React Flow, Tailwind CSS, and shadcn/ui.

## Stack

- **React 19** + **TypeScript** (strict)
- **Vite** — dev server and build
- **@xyflow/react** — node canvas and connectors
- **Tailwind CSS v4** + **shadcn/ui** — UI components
- **TanStack Query** — server state and API caching
- **Zustand** — workflow graph state
- **@dnd-kit** — drag components from palette to canvas

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

- `/` — landing page
- `/editor` — workflow canvas editor

## Environment

Copy `.env.example` to `.env`:

```bash
VITE_API_BASE_URL=/api
```

In development, Vite proxies `/api` to `http://localhost:8000` (Django).

## API types (OpenAPI)

When your Django backend exposes an OpenAPI schema:

1. Export it to `openapi/schema.yaml` (or point the script at your live URL).
2. Run:

```bash
npm run generate:api
```

This generates `src/lib/types/api.generated.ts` for typed API clients.

## Project structure

```
src/
├── app/              # Providers, router
├── components/       # Shared UI and layout
├── features/
│   ├── canvas/       # React Flow canvas and custom nodes
│   ├── palette/      # Component library sidebar
│   └── inspector/    # Node configuration panel
├── lib/
│   ├── api/          # Axios client, TanStack Query hooks
│   └── types/        # Workflow and API types
├── pages/            # Route pages
└── stores/           # Zustand stores
```

## Django integration

Expected endpoints (adjust as your API evolves):

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/workflows/` | List workflows |
| GET | `/api/workflows/:id/` | Load workflow graph |
| PUT | `/api/workflows/:id/` | Save workflow graph |

Workflow graph shape is defined in `src/lib/types/workflow.ts`.

## Adding a new node type

1. Add the type to `ValenceNodeType` and its data interface in `workflow.ts`.
2. Add a definition to `NODE_TYPE_DEFINITIONS`.
3. Create a node component in `src/features/canvas/nodes/`.
4. Register it in `src/features/canvas/nodes/index.ts`.
5. Add inspector fields in `src/features/inspector/node-inspector.tsx`.

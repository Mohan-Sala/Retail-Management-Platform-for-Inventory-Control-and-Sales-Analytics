# ShopSense — Multi-vendor Commerce Analytics

ShopSense is a unified analytics, inventory, and vendor operations command center built for modern multi-vendor marketplaces. Built with a premium, type-safe stack, it allows administrators and vendors to gain real-time visibility into transactions, payouts, stock levels, and revenue distributions.

## Key Features

- **Separate Workspaces:** Tailored dashboards for Administrators (`/admin/*`) and Vendors (`/vendor/*`) with path-based routing.
- **Real-Time Analytics:** Visualize sales patterns, category distributions, and best-selling products using custom interactive charts.
- **Inventory Intelligence:** Track stock levels across multiple warehouses, set low-stock reorder levels, and manage vendor catalogs.
- **Transaction Ledger:** Track orders, payment status, payout status, and commissions. Clean UI with search, filter, and audit-ready data.
- **Aesthetic Design:** Premium glassmorphism layout, vibrant tailored color palettes (dark-mode ready), and subtle micro-animations using Framer Motion.

---

## Tech Stack

- **Framework:** [TanStack Start](https://tanstack.com/start) (Full-stack React framework with server-side rendering)
- **Routing:** [TanStack Router](https://tanstack.com/router) (Type-safe file-based routing)
- **State & Data Fetching:** [TanStack Query](https://tanstack.com/query) (React Query)
- **Styling:** Tailwind CSS v4 (with `@tailwindcss/vite` compiler integration)
- **Components:** Radix UI primitives & Shadcn UI design patterns
- **Icons & Motion:** Lucide React & Framer Motion
- **Build Tool:** Vite v8

---

## Steps to Run the Project Locally

This repository contains a `bun.lock` file, meaning **Bun** is the recommended package manager. You can also run the project using standard Node.js tools like **npm**, **pnpm**, or **yarn**.

### 1. Prerequisites
Ensure you have the following installed on your machine:
- **Bun** (Recommended) or **Node.js** (LTS version 20+).
- Git.

### 2. Install Dependencies
Navigate to the project root directory and run the install command.

**Using Bun:**
```bash
bun install
```

**Using npm:**
```bash
npm install
```

**Using pnpm:**
```bash
pnpm install
```

### 3. Start the Development Server
Run the dev script to spin up the local development environment.

**Using Bun:**
```bash
bun run dev
```

**Using npm:**
```bash
npm run dev
```

The dev server will typically start at:
👉 **[http://localhost:3000](http://localhost:3000)** (or the next available port).

### 4. Build for Production
To bundle the project for production deployment, run the build command. This compiles the client and bundles the server components via Nitro.

**Using Bun:**
```bash
bun run build
```

**Using npm:**
```bash
npm run build
```

### 5. Preview Production Build Locally
To test the built production bundle locally before deploying it, use the preview command.

**Using Bun:**
```bash
bun run preview
```

**Using npm:**
```bash
npm run preview
```

---

## Development Guidelines

- **File-Based Routing:** Pages and nested routes are located in `src/routes/`. Adding a file automatically generates routes.
- **Auto-generated Router Tree:** Do not edit `src/routeTree.gen.ts` manually; it is updated automatically by Vite when pages are added or modified.
- **Tailwind CSS v4:** Styles are defined in `src/styles.css` using the modern Tailwind v4 syntax. Custom variables and themes are registered directly using CSS custom properties.
- **Lovable Metadata Folder:** The `.lovable/` folder is not required for standard local development or deployment, as it only holds cloud editor metadata. It is entirely safe to delete it.

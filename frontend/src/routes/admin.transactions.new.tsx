import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/transactions/new")({
  beforeLoad: () => {
    throw redirect({ to: "/admin/transactions" });
  },
  component: () => null,
});

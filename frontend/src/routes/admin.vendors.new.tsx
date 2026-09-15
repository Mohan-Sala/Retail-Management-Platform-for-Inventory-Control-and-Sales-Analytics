import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/vendors/new")({
  beforeLoad: () => {
    throw redirect({ to: "/admin/vendors" });
  },
  component: () => null,
});

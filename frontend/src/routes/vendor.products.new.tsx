import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/vendor/products/new")({
  beforeLoad: () => {
    throw redirect({ to: "/vendor/products" });
  },
  component: () => null,
});

import { createFileRoute } from "@tanstack/react-router";
import { ProfilePage } from "@/components/common/ProfilePage";
export const Route = createFileRoute("/vendor/profile")({ component: ProfilePage });

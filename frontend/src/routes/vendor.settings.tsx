import { createFileRoute } from "@tanstack/react-router";
import { SettingsPage } from "@/components/common/SettingsPage";
export const Route = createFileRoute("/vendor/settings")({ component: SettingsPage });

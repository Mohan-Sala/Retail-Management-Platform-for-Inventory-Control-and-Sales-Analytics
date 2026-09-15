import React from "react";
import { Button } from "@/components/ui/button";
import { Sun, Moon, Laptop } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

/**
 * @desc Selector toggle buttons controlling light, dark, or system preferred contexts
 */
export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center gap-1 bg-muted/40 p-1 border border-border/60 rounded-xl max-w-fit">
      <Button
        variant={theme === "light" ? "secondary" : "ghost"}
        size="icon"
        onClick={() => setTheme("light")}
        className="h-7 w-7 rounded-lg"
        title="Light Mode"
      >
        <Sun className="h-4 w-4 text-foreground" />
      </Button>
      <Button
        variant={theme === "dark" ? "secondary" : "ghost"}
        size="icon"
        onClick={() => setTheme("dark")}
        className="h-7 w-7 rounded-lg"
        title="Dark Mode"
      >
        <Moon className="h-4 w-4 text-foreground" />
      </Button>
      <Button
        variant={theme === "system" ? "secondary" : "ghost"}
        size="icon"
        onClick={() => setTheme("system")}
        className="h-7 w-7 rounded-lg"
        title="System Preference"
      >
        <Laptop className="h-4 w-4 text-foreground" />
      </Button>
    </div>
  );
}
export default ThemeSwitcher;

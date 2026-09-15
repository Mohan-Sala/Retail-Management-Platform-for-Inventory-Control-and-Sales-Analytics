import React, { useEffect, useState } from "react";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { useNavigate } from "@tanstack/react-router";
import api from "@/lib/api";
import { Search } from "lucide-react";

/**
 * @desc Command palette overlay activated via Ctrl+K. Searches cross-module inputs and highlights matches.
 */
export function SearchCommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setResults({});
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        const res: any = await api.get(`/search?q=${query}`);
        setResults(res.data || {});
      } catch (e) {
        console.error("Search failed:", e);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (link: string) => {
    setOpen(false);
    navigate({ to: link });
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-muted/40 hover:bg-muted/60 text-muted-foreground text-xs font-medium cursor-pointer max-w-[200px]"
      >
        <Search className="h-3.5 w-3.5" />
        <span>Search...</span>
        <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 ml-auto">
          <span className="text-[8px]">⌘</span>K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Search products, orders, customers, reports..."
          value={query}
          onValueChange={setQuery}
        />
        <CommandList className="text-xs text-foreground bg-card border border-border">
          {loading && <div className="p-4 text-center text-muted-foreground">Searching database...</div>}
          {!loading && Object.keys(results).length === 0 && query && (
            <CommandEmpty>No matching records found.</CommandEmpty>
          )}

          {Object.keys(results).map((groupKey) => {
            const items = results[groupKey] || [];
            if (items.length === 0) return null;

            return (
              <CommandGroup key={groupKey} heading={groupKey.toUpperCase()} className="capitalize text-foreground font-semibold">
                {items.map((item: any) => (
                  <CommandItem
                    key={item.id}
                    onSelect={() => handleSelect(item.link)}
                    className="cursor-pointer text-foreground hover:bg-muted/50 p-2 flex flex-col items-start gap-0.5 rounded-lg"
                  >
                    <span dangerouslySetInnerHTML={{ __html: item.highlight }} className="font-semibold block" />
                    <span className="text-[10px] text-muted-foreground">{item.subtitle}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            );
          })}
        </CommandList>
      </CommandDialog>
    </>
  );
}
export default SearchCommandPalette;

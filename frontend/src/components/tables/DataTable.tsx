import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import { useState, useMemo } from "react";
import { ArrowUpDown, ChevronLeft, ChevronRight, Search, Eye } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface DataTableProps<T> {
  columns: ColumnDef<T, any>[];
  data: T[];
  searchPlaceholder?: string;
  searchKeys?: (keyof T)[];
  loading?: boolean;
  onBulkAction?: (selectedRows: T[]) => void;
  exportMenu?: React.ReactNode;
}

/**
 * @desc Standardized Data Table component supporting column toggles, checkboxes row selection, custom paginations, search, and loading/empty skeletal states.
 */
export function DataTable<T>({
  columns,
  data,
  searchPlaceholder = "Search...",
  searchKeys,
  loading = false,
  onBulkAction,
  exportMenu,
}: DataTableProps<T>) {
  const [globalFilter, setGlobalFilter] = useState("");
  const [rowSelection, setRowSelection] = useState({});
  const [columnVisibility, setColumnVisibility] = useState({});

  // Memoize data to avoid duplicate calculations
  const memoizedData = useMemo(() => data, [data]);

  const table = useReactTable({
    data: memoizedData,
    columns,
    state: {
      globalFilter,
      rowSelection,
      columnVisibility,
    },
    onGlobalFilterChange: setGlobalFilter,
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: setColumnVisibility,
    globalFilterFn: (row, _colId, value) => {
      if (!value) return true;
      const v = String(value).toLowerCase();
      const keys = searchKeys ?? (Object.keys(row.original as object) as (keyof T)[]);
      return keys.some((k) => String((row.original as any)[k] ?? "").toLowerCase().includes(v));
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  const selectedRows = table.getSelectedRowModel().rows.map((r) => r.original);

  return (
    <div className="space-y-3 text-xs text-left" aria-live="polite">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="relative max-w-sm w-full">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder={searchPlaceholder}
            className="pl-9 text-foreground"
            aria-label="Table Global Search"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {/* Column Toggle Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8">
                <Eye className="mr-2 h-4 w-4" /> Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[150px] bg-card border border-border">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize text-foreground"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) => column.toggleVisibility(!!value)}
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Export Slot */}
          {exportMenu}
        </div>
      </div>

      {/* Bulk Action Ribbon */}
      {selectedRows.length > 0 && onBulkAction && (
        <div className="flex items-center justify-between p-2.5 bg-primary/10 border border-primary/20 rounded-lg">
          <span className="font-semibold text-foreground">{selectedRows.length} rows selected</span>
          <Button variant="ghost" size="sm" onClick={() => onBulkAction(selectedRows)} className="text-primary hover:bg-primary/5">
            Apply Bulk Action
          </Button>
        </div>
      )}

      {/* Main Table Layout */}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id} className="bg-muted/40 hover:bg-muted/40 border-b border-border">
                {hg.headers.map((h) => (
                  <TableHead
                    key={h.id}
                    onClick={h.column.getToggleSortingHandler()}
                    className={h.column.getCanSort() ? "cursor-pointer select-none text-foreground font-semibold" : "text-foreground font-semibold"}
                    aria-sort={
                      h.column.getIsSorted() === "asc"
                        ? "ascending"
                        : h.column.getIsSorted() === "desc"
                        ? "descending"
                        : "none"
                    }
                  >
                    <span className="inline-flex items-center gap-1">
                      {flexRender(h.column.columnDef.header, h.getContext())}
                      {h.column.getCanSort() && <ArrowUpDown className="h-3 w-3 opacity-50" />}
                    </span>
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    <span>Loading dataset...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-sm text-muted-foreground">
                  No records matching requirements.
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className="border-b border-border/40 hover:bg-muted/10">
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-muted-foreground gap-2 pt-1">
        <div className="flex items-center gap-1.5">
          <span>{table.getFilteredRowModel().rows.length} total results</span>
          <span className="text-muted-foreground/35">|</span>
          <select
            value={table.getState().pagination.pageSize}
            onChange={(e) => table.setPageSize(Number(e.target.value))}
            className="bg-transparent border border-border rounded px-1.5 py-0.5"
            aria-label="Set Page Size Limit"
          >
            {[5, 10, 20, 50].map((size) => (
              <option key={size} value={size} className="bg-card text-foreground">
                Show {size}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span>
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount() || 1}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="h-7 w-7"
            aria-label="Previous Table Page"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="h-7 w-7"
            aria-label="Next Table Page"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
export default DataTable;

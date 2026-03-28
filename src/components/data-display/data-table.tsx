"use client";

import * as React from "react";
import {
  type ColumnDef,
  type ColumnFiltersState,
  type Header,
  type RowData,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ChevronUp, ChevronDown, ChevronsUpDown, Filter } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    enableSorting?: boolean;
    filterVariant?: "dropdown";
    filterOptions?: { label: string; value: string }[];
  }
}

function SortableHeader<TData>({
  header,
  children,
}: {
  header: Header<TData, unknown>;
  children: React.ReactNode;
}) {
  const sorted = header.column.getIsSorted();
  return (
    <button
      className="flex items-center gap-1 hover:text-foreground text-left"
      onClick={header.column.getToggleSortingHandler()}
    >
      {children}
      {sorted === "asc" && <ChevronUp className="h-3.5 w-3.5" />}
      {sorted === "desc" && <ChevronDown className="h-3.5 w-3.5" />}
      {!sorted && <ChevronsUpDown className="h-3.5 w-3.5 opacity-40" />}
    </button>
  );
}

function ColumnFilterDropdown<TData>({
  header,
  children,
}: {
  header: Header<TData, unknown>;
  children: React.ReactNode;
}) {
  const options = header.column.columnDef.meta?.filterOptions ?? [];
  const currentFilter =
    (header.column.getFilterValue() as string[] | undefined) ?? [];

  function toggle(value: string) {
    const next = currentFilter.includes(value)
      ? currentFilter.filter((v) => v !== value)
      : [...currentFilter, value];
    header.column.setFilterValue(next.length ? next : undefined);
  }

  const isFiltered = currentFilter.length > 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "flex items-center gap-1 hover:text-foreground text-left",
            isFiltered && "text-foreground font-semibold"
          )}
        >
          {children}
          <Filter
            className={cn(
              "h-3.5 w-3.5",
              isFiltered ? "opacity-100" : "opacity-40"
            )}
          />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuLabel>Filter</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {options.map((opt) => (
          <DropdownMenuCheckboxItem
            key={opt.value}
            checked={currentFilter.includes(opt.value)}
            onCheckedChange={() => toggle(opt.value)}
            onSelect={(e) => e.preventDefault()}
          >
            {opt.label}
          </DropdownMenuCheckboxItem>
        ))}
        {isFiltered && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              checked={false}
              onCheckedChange={() =>
                header.column.setFilterValue(undefined)
              }
              onSelect={(e) => e.preventDefault()}
              className="text-muted-foreground text-xs"
            >
              Clear filter
            </DropdownMenuCheckboxItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface DataTableProps<TData, TValue> {
  title?: string;
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  enableFiltering?: boolean;
  filterColumn?: string;
  filterPlaceholder?: string;
  enablePagination?: boolean;
  pageSize?: number;
  isLoading?: boolean;
  className?: string;
}

export function DataTable<TData, TValue>({
  title,
  columns,
  data,
  enableFiltering = false,
  filterColumn,
  filterPlaceholder = "Filter...",
  enablePagination = false,
  pageSize = 10,
  isLoading = false,
  className,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: enableFiltering ? getFilteredRowModel() : undefined,
    getPaginationRowModel: enablePagination ? getPaginationRowModel() : undefined,
    state: {
      sorting,
      columnFilters,
    },
    initialState: {
      pagination: {
        pageSize,
      },
    },
  });

  function renderHeaderCell(header: Header<TData, unknown>) {
    if (header.isPlaceholder) return null;
    const rendered = flexRender(header.column.columnDef.header, header.getContext());
    const meta = header.column.columnDef.meta;
    if (meta?.enableSorting) {
      return <SortableHeader header={header}>{rendered}</SortableHeader>;
    }
    if (meta?.filterVariant === "dropdown") {
      return <ColumnFilterDropdown header={header}>{rendered}</ColumnFilterDropdown>;
    }
    return rendered;
  }

  if (isLoading) {
    return (
      <Card className={className}>
        {title && (
          <CardHeader className="pb-2">
            <Skeleton className="h-5 w-40" />
          </CardHeader>
        )}
        <CardContent className={title ? undefined : "pt-6"}>
          <div className="space-y-2">
            {enableFiltering && <Skeleton className="h-10 w-64" />}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    {columns.map((_, i) => (
                      <TableHead key={i}>
                        <Skeleton className="h-4 w-20" />
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...Array(5)].map((_, rowIndex) => (
                    <TableRow key={rowIndex}>
                      {columns.map((_, cellIndex) => (
                        <TableCell key={cellIndex}>
                          <Skeleton className="h-4 w-24" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const content = (
    <div className="space-y-4">
      {enableFiltering && filterColumn && (
        <Input
          placeholder={filterPlaceholder}
          value={(table.getColumn(filterColumn)?.getFilterValue() as string) ?? ""}
          onChange={(event) => table.getColumn(filterColumn)?.setFilterValue(event.target.value)}
          className="max-w-sm"
        />
      )}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {renderHeaderCell(header)}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {enablePagination && (
        <div className="flex items-center justify-end space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );

  if (title) {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">{title}</CardTitle>
        </CardHeader>
        <CardContent>{content}</CardContent>
      </Card>
    );
  }

  return <div className={className}>{content}</div>;
}

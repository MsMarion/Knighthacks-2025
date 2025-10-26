/**
 * Scores Table Component
 * 
 * Virtualized table showing per-cell predictions with sorting and filtering
 */

import { useMemo, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  Download,
} from "lucide-react";
import { useDashboardStore } from "../../store/dashboardStore";

interface CellScore {
  frame_id: string;
  cell: string;
  top1_class: string;
  top1_confidence: number;
  entropy?: number;
  delta_vs_previous?: number;
}

export function ScoresTable() {
  const { pipelineEvents, selection, setSelectedFrame, setSelectedCells } = useDashboardStore();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");

  // Extract cell scores from pipeline events (filtered by selection if present)
  const data = useMemo(() => {
    const selectedEvents = selection.time_window
      ? pipelineEvents.filter(
          (e) =>
            e.timestamp >= selection.time_window!.start_timestamp &&
            e.timestamp <= selection.time_window!.end_timestamp
        )
      : pipelineEvents;

    const scores: CellScore[] = [];
    selectedEvents.forEach((event) => {
      if (event.cell_scores) {
        event.cell_scores.forEach((score) => {
          scores.push({
            frame_id: event.frame_id,
            cell: score.cell,
            top1_class: score.top1_class,
            top1_confidence: score.top1_confidence,
            entropy: score.entropy,
            delta_vs_previous: score.delta_vs_previous,
          });
        });
      }
    });

    return scores;
  }, [pipelineEvents, selection.time_window]);

  // Define columns
  const columns = useMemo<ColumnDef<CellScore>[]>(
    () => [
      {
        accessorKey: "frame_id",
        header: "Frame",
        cell: ({ row }) => (
          <code className="text-xs font-mono text-muted-foreground">
            {row.original.frame_id.slice(-8)}
          </code>
        ),
      },
      {
        accessorKey: "cell",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
              Cell
              {column.getIsSorted() === "asc" ? (
                <ArrowUp className="ml-2 h-3 w-3" />
              ) : column.getIsSorted() === "desc" ? (
                <ArrowDown className="ml-2 h-3 w-3" />
              ) : (
                <ArrowUpDown className="ml-2 h-3 w-3" />
              )}
            </Button>
          );
        },
        cell: ({ row }) => (
          <Badge variant="outline" className="font-mono">
            {row.original.cell}
          </Badge>
        ),
      },
      {
        accessorKey: "top1_class",
        header: "Class",
        cell: ({ row }) => (
          <Badge variant="secondary" className="font-mono">
            {row.original.top1_class === "0" ? "empty" : row.original.top1_class}
          </Badge>
        ),
      },
      {
        accessorKey: "top1_confidence",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
              Confidence
              {column.getIsSorted() === "asc" ? (
                <ArrowUp className="ml-2 h-3 w-3" />
              ) : column.getIsSorted() === "desc" ? (
                <ArrowDown className="ml-2 h-3 w-3" />
              ) : (
                <ArrowUpDown className="ml-2 h-3 w-3" />
              )}
            </Button>
          );
        },
        cell: ({ row }) => {
          const confidence = row.original.top1_confidence;
          const color =
            confidence >= 0.8 ? "bg-green-500" : confidence >= 0.5 ? "bg-yellow-500" : "bg-red-500";
          return (
            <div className="flex items-center gap-2">
              <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full ${color} transition-all duration-300`}
                  style={{ width: `${confidence * 100}%` }}
                />
              </div>
              <span className="text-xs font-mono text-muted-foreground">
                {(confidence * 100).toFixed(1)}%
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: "entropy",
        header: "Entropy",
        cell: ({ row }) =>
          row.original.entropy ? (
            <span className="text-xs font-mono text-muted-foreground">
              {row.original.entropy.toFixed(3)}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          ),
      },
      {
        accessorKey: "delta_vs_previous",
        header: "Δ",
        cell: ({ row }) =>
          row.original.delta_vs_previous ? (
            <Badge
              variant="outline"
              className={
                row.original.delta_vs_previous > 0.3
                  ? "border-yellow-500/50 bg-yellow-500/10"
                  : ""
              }
            >
              {row.original.delta_vs_previous.toFixed(2)}
            </Badge>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          ),
      },
    ],
    []
  );

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      globalFilter,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const handleRowClick = (row: CellScore) => {
    setSelectedFrame(row.frame_id);
    setSelectedCells([row.cell]);
  };

  return (
    <Card className="flex flex-col h-full transition-all duration-300 hover:shadow-lg">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Cell Scores</h3>
          <p className="text-xs text-muted-foreground">
            {table.getFilteredRowModel().rows.length} rows
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="pl-8 h-9 w-[200px]"
            />
          </div>

          {/* Export */}
          <Button variant="outline" size="sm" className="h-9">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-card border-b z-10">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="h-10 px-4 text-left align-middle font-medium text-muted-foreground"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className={`border-b transition-colors hover:bg-muted/50 cursor-pointer ${
                    selection.selected_frame_id === row.original.frame_id &&
                    selection.selected_cells?.includes(row.original.cell)
                      ? "bg-primary/10"
                      : ""
                  }`}
                  onClick={() => handleRowClick(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="p-4 align-middle">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                  No results.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

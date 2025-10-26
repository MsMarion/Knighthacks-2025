"use client";
import * as React from "react";
import { useMemo, useState } from "react";
import { ColumnDef, flexRender, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, useReactTable } from "@tanstack/react-table";
import { useSelection } from "../SelectionStore";

type Row = { frame: string; cell: string; top1: string; confidence?: number; entropy?: number };

export function ScoresTable() {
  const [rows] = useState<Row[]>([]); // plug your data source here
  const setFrame = useSelection(s => s.setFrame);
  const setCell = useSelection(s => s.setCell);

  const columns = useMemo<ColumnDef<Row>[]>(() => [
    { accessorKey: "frame", header: "Frame" },
    { accessorKey: "cell", header: "Cell" },
    { accessorKey: "top1", header: "Top-1" },
    { accessorKey: "confidence", header: "Conf" },
    { accessorKey: "entropy", header: "Entropy" }
  ], []);

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel()
  });

  return (
    <div>
      <div className="mb-2 text-sm font-medium">Scores</div>
      <div className="overflow-hidden rounded-xl ring-1 ring-white/10">
        <table className="w-full text-sm">
          <thead className="bg-zinc-900 text-zinc-300">
            {table.getHeaderGroups().map(hg => (
              <tr key={hg.id}>
                {hg.headers.map(h => (
                  <th key={h.id} className="px-3 py-2 text-left">{flexRender(h.column.columnDef.header, h.getContext())}</th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-white/5">
            {table.getRowModel().rows.map(r => (
              <tr key={r.id} className="hover:bg-white/5 cursor-pointer"
                  onClick={() => { setFrame(r.getValue("frame")); setCell(r.getValue("cell")); }}>
                {r.getVisibleCells().map(c => (
                  <td key={c.id} className="px-3 py-2">{flexRender(c.column.columnDef.cell, c.getContext()) || String(c.getValue() ?? "")}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

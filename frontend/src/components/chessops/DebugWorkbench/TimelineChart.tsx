"use client";
import { useEffect, useState } from "react";
import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useSelection } from "../SelectionStore";
import { sse } from "@/lib/streams";

type Point = { t: number; preprocess?: number; grid?: number; classify?: number; post?: number; conf?: number; detections?: number };

export function TimelineChart() {
  const [data, setData] = useState<Point[]>([]);
  const setWindow = useSelection((s) => s.setWindow);

  useEffect(() => {
    const off = sse<Point>(process.env.NEXT_PUBLIC_PIPELINE_EVENTS_URL, (d) => {
      setData((prev) => [...prev.slice(-999), d]);
    });
    return off;
  }, []);

  return (
    <div className="rounded-2xl bg-zinc-950 p-3 shadow-soft ring-1 ring-white/10">
      <div className="mb-2 text-sm font-medium">Pipeline Timeline</div>
      <div className="h-48">
        <ResponsiveContainer>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="a" x1="0" x2="0" y1="0" y2="1">
                <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#a78bfa" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)"/>
            <XAxis dataKey="t" stroke="#999" tick={{ fontSize: 10 }}/>
            <YAxis stroke="#999" tick={{ fontSize: 10 }}/>
            <Tooltip contentStyle={{ background: "#0b0b0c", border: "1px solid rgba(255,255,255,.08)" }}/>
            <Legend />
            <Area type="monotone" dataKey="preprocess" stroke="#a78bfa" fill="url(#a)" name="Preprocess (ms)"/>
            <Area type="monotone" dataKey="grid" stroke="#60a5fa" fillOpacity={0.1} name="Grid Fit (ms)"/>
            <Area type="monotone" dataKey="classify" stroke="#34d399" fillOpacity={0.1} name="Classify (ms)"/>
            <Area type="monotone" dataKey="post" stroke="#f59e0b" fillOpacity={0.1} name="Post (ms)"/>
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 flex justify-end">
        <button
          onClick={() => {
            if (!data.length) return;
            const start = data[Math.max(0, data.length - 200)]?.t ?? data[0].t;
            const end = data[data.length - 1].t;
            setWindow({ start, end });
          }}
          className="rounded-xl bg-zinc-900 px-3 py-1 text-xs"
        >
          Focus last window
        </button>
      </div>
    </div>
  );
}

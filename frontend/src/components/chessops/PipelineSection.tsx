"use client";

interface PipelineStep {
  name: string;
  duration: number;
  color: string;
  description: string;
}

const PIPELINE_STEPS: PipelineStep[] = [
  {
    name: "Preprocess",
    duration: 0,
    color: "bg-blue-400",
    description: "→ Preprocess (ms)"
  },
  {
    name: "Grid Fit", 
    duration: 0,
    color: "bg-orange-400",
    description: "→ Grid Fit (ms)"
  },
  {
    name: "Classify",
    duration: 0,
    color: "bg-purple-400", 
    description: "→ Classify (ms)"
  },
  {
    name: "Post",
    duration: 0,
    color: "bg-green-400",
    description: "→ Post (ms)"
  }
];

export function PipelineSection() {
  return (
    <div className="rounded-2xl bg-zinc-950 shadow-soft ring-1 ring-white/10">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <h3 className="text-lg font-semibold text-white">Pipeline Processing</h3>
        </div>
        <button className="text-sm text-zinc-400 hover:text-white transition-colors">
          Focus last window
        </button>
      </div>
      <div className="p-6">
        <div className="text-sm text-zinc-400 mb-6">
          Raw → Grid Fit → Crops + Logits → Board + FEN/PGN (hook to your pipeline images and scores)
        </div>
        <div className="grid grid-cols-4 gap-4">
          {PIPELINE_STEPS.map((step, index) => (
            <div 
              key={step.name}
              className="bg-gradient-to-br from-zinc-900/50 to-zinc-950/50 rounded-lg p-4 border border-zinc-700/50 hover:border-zinc-600/50 transition-all"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs text-zinc-500 font-medium">{step.name}</div>
                <div className={`w-2 h-2 rounded-full ${step.color} animate-pulse`} />
              </div>
              <div className="text-2xl font-bold text-white mb-1">{step.duration}ms</div>
              <div className="text-xs text-zinc-500">{step.description}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

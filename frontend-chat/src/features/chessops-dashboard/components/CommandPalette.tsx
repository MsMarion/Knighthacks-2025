/**
 * Command Palette for ChessOps Dashboard
 * 
 * Quick navigation and actions via Cmd+K
 */

import { useState } from "react";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
} from "@/components/ui/command";
import {
  FileCode,
  Table,
  Grid3x3,
  CheckSquare,
  AlertTriangle,
  Camera,
  Play,
  Pause,
  Download,
  RefreshCw,
} from "lucide-react";
import { useDashboardStore } from "../store/dashboardStore";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const { setActiveTab, clearPipelineEvents, clearAgentEvents, clearSelection } =
    useDashboardStore();
  const [search, setSearch] = useState("");

  const handleSelect = (action: () => void) => {
    action();
    onOpenChange(false);
    setSearch("");
  };

  const commands = [
    {
      group: "Navigation",
      items: [
        {
          icon: <FileCode className="mr-2 h-4 w-4" />,
          label: "Go to Pipeline",
          shortcut: "⌘P" as string | undefined,
          action: () => setActiveTab("pipeline"),
        },
        {
          icon: <Table className="mr-2 h-4 w-4" />,
          label: "Go to Scores Table",
          shortcut: "⌘S" as string | undefined,
          action: () => setActiveTab("scores"),
        },
        {
          icon: <Grid3x3 className="mr-2 h-4 w-4" />,
          label: "Go to Heatmaps",
          shortcut: "⌘H" as string | undefined,
          action: () => setActiveTab("heatmaps"),
        },
        {
          icon: <CheckSquare className="mr-2 h-4 w-4" />,
          label: "Go to Boardstate",
          shortcut: "⌘B" as string | undefined,
          action: () => setActiveTab("boardstate"),
        },
        {
          icon: <AlertTriangle className="mr-2 h-4 w-4" />,
          label: "Go to Alerts",
          shortcut: "⌘A" as string | undefined,
          action: () => setActiveTab("alerts"),
        },
      ],
    },
    {
      group: "Actions",
      items: [
        {
          icon: <RefreshCw className="mr-2 h-4 w-4" />,
          label: "Clear Pipeline Events",
          shortcut: undefined,
          action: clearPipelineEvents,
        },
        {
          icon: <RefreshCw className="mr-2 h-4 w-4" />,
          label: "Clear Agent Events",
          shortcut: undefined,
          action: clearAgentEvents,
        },
        {
          icon: <RefreshCw className="mr-2 h-4 w-4" />,
          label: "Clear Selection",
          shortcut: undefined,
          action: clearSelection,
        },
        {
          icon: <Download className="mr-2 h-4 w-4" />,
          label: "Export Data",
          shortcut: undefined,
          action: () => console.log("Export"),
        },
      ],
    },
    {
      group: "Camera Controls",
      items: [
        {
          icon: <Camera className="mr-2 h-4 w-4" />,
          label: "Snapshot All Cameras",
          shortcut: undefined,
          action: () => console.log("Snapshot"),
        },
        {
          icon: <Play className="mr-2 h-4 w-4" />,
          label: "Play All Feeds",
          shortcut: undefined,
          action: () => console.log("Play"),
        },
        {
          icon: <Pause className="mr-2 h-4 w-4" />,
          label: "Pause All Feeds",
          shortcut: undefined,
          action: () => console.log("Pause"),
        },
      ],
    },
  ];

  // Filter commands based on search
  const filteredCommands = commands.map((group) => ({
    ...group,
    items: group.items.filter((item) =>
      item.label.toLowerCase().includes(search.toLowerCase())
    ),
  })).filter((group) => group.items.length > 0);

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Type a command or search..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <CommandList>
        {filteredCommands.length === 0 ? (
          <CommandEmpty>No results found.</CommandEmpty>
        ) : (
          filteredCommands.map((group) => (
            <CommandGroup key={group.group} heading={group.group}>
              {group.items.map((item) => (
                <CommandItem
                  key={item.label}
                  onSelect={() => handleSelect(item.action)}
                >
                  {item.icon}
                  <span>{item.label}</span>
                  {item.shortcut && <CommandShortcut>{item.shortcut}</CommandShortcut>}
                </CommandItem>
              ))}
            </CommandGroup>
          ))
        )}
      </CommandList>
    </CommandDialog>
  );
}


/**
 * Command Palette Component
 * 
 * Keyboard-driven command menu for quick navigation and actions
 */

import * as React from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface CommandProps {
  children: React.ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function Command({ children, open, onOpenChange }: CommandProps) {
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
      if (e.key === "Escape") {
        onOpenChange(false);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] animate-fade-in">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-background/80 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />

      {/* Command Dialog */}
      <div className="relative z-50 w-full max-w-xl">
        {children}
      </div>
    </div>
  );
}

interface CommandInputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export function CommandInput({ className, ...props }: CommandInputProps) {
  return (
    <div className="flex items-center border-b px-4 bg-card">
      <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
      <input
        className={cn(
          "flex h-14 w-full rounded-none bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...props}
      />
    </div>
  );
}

interface CommandListProps {
  children: React.ReactNode;
}

export function CommandList({ children }: CommandListProps) {
  return (
    <div className="max-h-[400px] overflow-y-auto overflow-x-hidden p-2">
      {children}
    </div>
  );
}

interface CommandEmptyProps {
  children: React.ReactNode;
}

export function CommandEmpty({ children }: CommandEmptyProps) {
  return (
    <div className="py-6 text-center text-sm text-muted-foreground">
      {children}
    </div>
  );
}

interface CommandGroupProps {
  children: React.ReactNode;
  heading?: string;
}

export function CommandGroup({ children, heading }: CommandGroupProps) {
  return (
    <div className="overflow-hidden px-2 py-2">
      {heading && (
        <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
          {heading}
        </div>
      )}
      {children}
    </div>
  );
}

interface CommandItemProps {
  children: React.ReactNode;
  onSelect?: () => void;
}

export function CommandItem({ children, onSelect }: CommandItemProps) {
  return (
    <div
      className="relative flex cursor-pointer select-none items-center rounded-lg px-3 py-2.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
      onClick={onSelect}
    >
      {children}
    </div>
  );
}

interface CommandShortcutProps {
  children: React.ReactNode;
}

export function CommandShortcut({ children }: CommandShortcutProps) {
  return (
    <span className="ml-auto text-xs tracking-widest text-muted-foreground">
      {children}
    </span>
  );
}

interface CommandDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

export function CommandDialog({ children, open, onOpenChange }: CommandDialogProps) {
  return (
    <Command open={open} onOpenChange={onOpenChange}>
      <div className="overflow-hidden rounded-2xl border-2 border-border bg-card shadow-2xl">
        {children}
      </div>
    </Command>
  );
}


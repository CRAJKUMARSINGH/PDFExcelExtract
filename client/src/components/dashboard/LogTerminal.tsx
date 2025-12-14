import { useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface LogEntry {
  id: string;
  timestamp: string;
  level: "info" | "success" | "warning" | "error";
  message: string;
}

interface LogTerminalProps {
  logs: LogEntry[];
  isOpen: boolean;
}

export function LogTerminal({ logs, isOpen }: LogTerminalProps) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  if (!isOpen) return null;

  return (
    <div className="rounded-lg border border-border bg-[#1e1e1e] overflow-hidden shadow-2xl mt-8">
      <div className="flex items-center justify-between px-4 py-2 bg-[#2d2d2d] border-b border-[#3d3d3d]">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
            <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
            <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
          </div>
          <span className="ml-3 text-xs text-gray-400 font-mono">
            term -- pdf-engine
          </span>
        </div>
        <div className="text-xs text-gray-500 font-mono">bash</div>
      </div>
      <ScrollArea className="h-64 w-full p-4 font-mono text-xs md:text-sm">
        <div className="space-y-1">
          {logs.map((log) => (
            <div key={log.id} className="flex gap-3">
              <span className="text-gray-500 shrink-0 select-none">
                [{log.timestamp}]
              </span>
              <span
                className={cn(
                  "break-all",
                  log.level === "info" && "text-gray-300",
                  log.level === "success" && "text-green-400 font-semibold",
                  log.level === "warning" && "text-yellow-400",
                  log.level === "error" && "text-red-400"
                )}
              >
                {log.level === "success" && "✔ "}
                {log.message}
              </span>
            </div>
          ))}
          <div ref={endRef} />
        </div>
      </ScrollArea>
    </div>
  );
}


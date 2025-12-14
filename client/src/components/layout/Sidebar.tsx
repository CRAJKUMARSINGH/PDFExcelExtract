import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { FileText, LayoutDashboard, Settings, History, Terminal } from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Conversion History", href: "/history", icon: History },
  { name: "Process Logs", href: "/logs", icon: Terminal },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const [location] = useLocation();

  return (
    <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 z-[80] bg-sidebar border-r border-sidebar-border">
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex items-center h-16 flex-shrink-0 px-4 bg-sidebar-accent/50 border-b border-sidebar-border">
          <div className="h-8 w-8 rounded-md mr-3 bg-primary flex items-center justify-center">
            <FileText className="h-5 w-5 text-primary-foreground" />
          </div>
          <h1 className="text-sidebar-foreground font-semibold tracking-tight">
            PDFExcelExtract
          </h1>
        </div>
        <div className="flex-1 flex flex-col overflow-y-auto pt-5 pb-4">
          <nav className="mt-5 flex-1 px-2 space-y-1">
            {navigation.map((item) => {
              const isActive = location === item.href;
              return (
                <Link key={item.name} href={item.href}>
                  <div
                    className={cn(
                      isActive
                        ? "bg-sidebar-primary text-sidebar-primary-foreground"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-white",
                      "group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors duration-150 ease-in-out cursor-pointer"
                    )}
                  >
                    <item.icon
                      className={cn(
                        isActive
                          ? "text-sidebar-primary-foreground"
                          : "text-sidebar-foreground/50 group-hover:text-white",
                        "mr-3 flex-shrink-0 h-5 w-5"
                      )}
                      aria-hidden="true"
                    />
                    {item.name}
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex-shrink-0 flex border-t border-sidebar-border p-4">
          <div className="flex items-center">
            <div className="ml-3">
              <p className="text-xs font-medium text-sidebar-foreground/50">
                Version 2.4.0 (Stable)
              </p>
              <p className="text-xs font-medium text-green-400 mt-1">
                ● System Operational
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


import { DashboardHeader } from "~/components/dashboard/header";
import { SidebarProvider } from "~/components/ui/sidebar";
import { AppSidebar } from "~/components/app-sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider className="bg-sidebar">
      <AppSidebar />
      <div className="h-svh min-w-0 flex-1 overflow-hidden lg:p-2">
        <div className="flex h-full w-full flex-col overflow-hidden bg-background lg:rounded-md lg:border">
          <DashboardHeader />
          <div className="flex-1 overflow-auto">{children}</div>
        </div>
      </div>
    </SidebarProvider>
  );
}

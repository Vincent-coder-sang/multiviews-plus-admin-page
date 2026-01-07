import { Outlet } from "react-router-dom";
import { useState, useEffect } from "react";
import AdminHeader from "./header";
import AdminSideBar from "./sidebar";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/toaster";

function AdminLayout() {
  const [openSidebar, setOpenSidebar] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (!mobile) {
        setOpenSidebar(false);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="flex w-full min-h-screen bg-background">
      {openSidebar && isMobile && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={() => setOpenSidebar(false)}
        />
      )}

      {/* Admin Sidebar */}
      <AdminSideBar open={openSidebar} setOpen={setOpenSidebar} />

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 lg:ml-[280px] min-w-0">
        {/* Admin Header */}
        <AdminHeader setOpen={setOpenSidebar} />

        {/* Main Content */}
        <main
          className={cn(
            "flex-1 p-4 md:p-6 lg:p-8 transition-all duration-300",
            "bg-muted/10" // subtle background
          )}
        >
          <div className="w-full max-w-[1800px] mx-auto">
            <div className="w-full p-4 rounded-lg shadow-sm bg-background md:p-6 overflow-x-auto">
              <Outlet />
            </div>
          </div>
        </main>
      </div>

      {/* Toast notifications */}
      <Toaster />
    </div>
  );
}

export default AdminLayout;
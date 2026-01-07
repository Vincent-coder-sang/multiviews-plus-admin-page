/* eslint-disable react/prop-types */
import {
  BadgeCheck,
  ChartNoAxesCombined,
  LayoutDashboard,
  Image,
  ChevronRight,
  LogOut,
} from "lucide-react";
import { Fragment } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { logoutUser } from "@/features/slices/authSlice";
import { useDispatch } from "react-redux";

const adminSidebarMenuItems = [
  {
    id: "dashboard",
    label: "Dashboard",
    path: "/admin/dashboard",
    icon: <LayoutDashboard className="w-5 h-5" />,
  },
  {
    id: "users",
    label: "User Management",
    path: "/admin/users",
    icon: <BadgeCheck className="w-5 h-5" />,
  },
  {
    id: "videos creators",
    label: "Content Creators management",
    path: "/admin/creators",
    icon: <BadgeCheck className="w-5 h-5" />,
  },
  {
    id: "videos",
    label: "Videos Management",
    path: "/admin/videos",
    icon: <Image className="w-5 h-5" />,
  },
];

function MenuItems({ menuItems, setOpen, isMobile }) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="flex flex-col gap-1">
      {menuItems.map((menuItem) => {
        const isActive = location.pathname.startsWith(menuItem.path);
        return (
          <button
            key={menuItem.id}
            onClick={() => {
              if (menuItem.external) window.open(menuItem.path, "_blank");
              else navigate(menuItem.path);
              if (isMobile && setOpen) setOpen(false);
            }}
            className={cn(
              "flex items-center justify-between rounded-lg px-4 py-3 text-sm font-medium transition-all",
              isActive
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  "transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                {menuItem.icon}
              </span>
              <span>{menuItem.label}</span>
            </div>
            {menuItem.external && (
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            )}
          </button>
        );
      })}
    </nav>
  );
}

function AdminSideBar({ open, setOpen }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleLogout = () => {
    dispatch(logoutUser());
    navigate("/auth/login");
  };

  return (
    <Fragment>
      {/* ✅ Mobile Sidebar */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-[270px] p-0">
          <div className="flex flex-col h-full">
            <SheetHeader className="p-5 border-b">
              <SheetTitle className="flex items-center gap-2 text-lg font-semibold">
                <ChartNoAxesCombined className="w-5 h-5 text-primary" />
                Admin Panel
              </SheetTitle>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
              <MenuItems
                menuItems={adminSidebarMenuItems}
                setOpen={setOpen}
                isMobile={true}
              />
            </div>

            <div className="p-4 border-t">
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={handleLogout}
              >
                <LogOut className="w-5 h-5" />
                Log Out
              </Button>
              <p className="text-xs text-muted-foreground text-center mt-2">
                v1.0.0
              </p>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* ✅ Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col fixed h-screen w-[270px] border-r bg-background z-10">
        <div
          onClick={() => navigate("/admin/dashboard")}
          className="flex items-center gap-2 p-5 border-b cursor-pointer hover:bg-accent/50 transition"
        >
          <ChartNoAxesCombined className="w-5 h-5 text-primary" />
          <h1 className="text-lg font-semibold">Admin Panel</h1>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          <MenuItems menuItems={adminSidebarMenuItems} />
        </div>

        <div className="p-4 border-t">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={handleLogout}
          >
            <LogOut className="w-5 h-5" />
            Log Out
          </Button>
        </div>
      </aside>
    </Fragment>
  );
}

export default AdminSideBar;

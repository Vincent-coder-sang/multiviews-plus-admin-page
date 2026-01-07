/* eslint-disable react/prop-types */
import { HousePlug, LogOut, Menu, UserCog, Settings } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Sheet, SheetContent, SheetTrigger } from "../../ui/sheet";
import { Button } from "../../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../ui/dropdown-menu";
import { Avatar, AvatarFallback } from "../../ui/avatar";
import { useState } from "react";
import { Label } from "../../ui/label";
import { useDispatch, useSelector } from "react-redux";
import { logoutUser } from "@/features/slices/authSlice";

const menuItems = [
  { id: "home", label: "Home", path: "/user/dashboard" },
  { id: "profile", label: "Profile", path: "/user/profile" },
  { id: "premium", label: "Premium Tips", path: "/user/vip" },
];

function MenuItems({ close }) {
  const navigate = useNavigate();

  return (
    <nav className="flex flex-col lg:flex-row gap-2 lg:gap-4 text-sm">
      {menuItems.map((item) => (
        <Label
          key={item.id}
          onClick={() => {
            navigate(item.path);
            close();
          }}
          className="px-2 py-1 rounded-md cursor-pointer hover:text-primary hover:bg-accent transition-colors"
        >
          {item.label}
        </Label>
      ))}
    </nav>
  );
}

function HeaderRight() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { name, userType } = useSelector((state) => state.auth);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative w-8 h-8 rounded-full">
          <Avatar className="w-8 h-8">
            <AvatarFallback className="text-xs font-bold text-white bg-gradient-to-r from-blue-500 to-purple-500">
              {name?.[0]?.toUpperCase() || "?"}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-48" align="end" forceMount>
        <DropdownMenuLabel className="font-normal pb-1">
          <div className="flex flex-col space-y-0.5">
            <p className="text-xs font-medium text-gray-800">{name}</p>
            <p className="text-[11px] text-gray-500">
              {userType === "admin"
                ? "Administrator"
                : userType === "vip"
                ? "VIP User"
                : "Customer"}
            </p>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => navigate("/user/profile")}
          className="text-sm py-1.5"
        >
          <UserCog className="w-3.5 h-3.5 mr-2" /> Profile
        </DropdownMenuItem>

        {userType === "admin" && (
          <DropdownMenuItem
            onClick={() => navigate("/admin/dashboard")}
            className="text-sm py-1.5"
          >
            <Settings className="w-3.5 h-3.5 mr-2" /> Admin
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => dispatch(logoutUser())}
          className="text-sm py-1.5 text-red-600 hover:text-red-700"
        >
          <LogOut className="w-3.5 h-3.5 mr-2" /> Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function UserHeader() {
  const [openMenu, setOpenMenu] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md">
      <div className="container flex items-center justify-between h-14 px-4">
        {/* Left Section - Mobile Menu & Logo */}
        <div className="flex items-center gap-3">
          <Sheet open={openMenu} onOpenChange={setOpenMenu}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>

            <SheetContent side="left" className="w-[240px]">
              <div className="flex flex-col h-full justify-between">
                <div>
                  <Link
                    to="/user/dashboard"
                    onClick={() => setOpenMenu(false)}
                    className="flex items-center gap-2 mb-6"
                  >
                    <HousePlug className="w-5 h-5 text-primary" />
                    <span className="text-sm font-semibold">
                      Monster Tipsters
                    </span>
                  </Link>
                  <MenuItems close={() => setOpenMenu(false)} />
                </div>
                <div className="pb-3 border-t mt-6 pt-3">
                  <HeaderRight />
                </div>
              </div>
            </SheetContent>
          </Sheet>

          <Link to="/user/dashboard" className="flex items-center gap-2">
            <HousePlug className="w-5 h-5 text-primary" />
            <span className="hidden sm:inline text-sm font-semibold">
              Monster Tipsters
            </span>
          </Link>
        </div>

        {/* Center - Desktop Menu */}
        <div className="hidden lg:flex items-center justify-center flex-1">
          <MenuItems close={() => setOpenMenu(false)} />
        </div>

        {/* Right - Profile */}
        <HeaderRight />
      </div>
    </header>
  );
}

export default UserHeader;

import { Outlet } from "react-router-dom";
import UserHeader from "./header";
import UserFooter from "./footer";

function UserLayout() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Common Header with shadow and fixed positioning */}
      <header className="sticky top-0 z-50 bg-white shadow-sm">
        <UserHeader />
      </header>
      
      {/* Main Content Area with max-width and padding */}
      <main className="flex-grow w-full px-4 py-8 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="p-6 bg-white rounded-lg shadow-sm">
          <Outlet />
        </div>
      </main>
      
      {/* Footer with subtle background */}
      <footer className="bg-gray-100 border-t border-gray-200">
        <UserFooter />
      </footer>
    </div>
  );
}

export default UserLayout;
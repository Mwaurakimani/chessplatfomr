import React from "react";
import { Outlet, useLocation, Link } from "react-router-dom";
import { Users, MessageSquare, User } from "lucide-react";

const Layout = () => {
  const location = useLocation();

  // Mock data for request counts - in real app this would come from context/state
  const incomingRequestsCount = 2;
  const outgoingRequestsCount = 1;
  const totalRequestsCount = incomingRequestsCount + outgoingRequestsCount;

  // Don't show notification badge when on requests page
  const showNotificationBadge =
    location.pathname !== "/requests" && totalRequestsCount > 0;

  const navItems = [
    { path: "/play", icon: Users, label: "Play" },
    { path: "/requests", icon: MessageSquare, label: "Requests" },
    { path: "/profile", icon: User, label: "Profile" },
  ];

  return (
    <div className="min-h-screen bg-[#141414] text-white flex flex-col font-sans">
      <main className="flex-1 pb-20">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[#212121] border-t border-gray-700 z-50">
        <div className="flex justify-around items-center h-16 px-4">
          {navItems.map(({ path, icon: Icon, label }) => (
            <Link
              key={path}
              to={path}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors relative ${
                location.pathname === path
                  ? "text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <div className="relative">
                <Icon size={20} />
                {/* Notification badge for requests positioned at top right of icon */}
                {path === "/requests" && showNotificationBadge && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                    {totalRequestsCount}
                  </span>
                )}
              </div>
              <span className="text-xs mt-1 font-medium">{label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default Layout;

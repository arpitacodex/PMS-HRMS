"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import Footer from "./Footer";

export default function ClientLayout({ children }) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const hideLayout =
    pathname.startsWith("/login") ||
    pathname.startsWith("/register");

  if (hideLayout) {
    return <>{children}</>;
  }

  return (
    <>
      <Navbar
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />

      {/* Main Layout */}
      <div className="flex min-h-screen bg-gray-50 dark:bg-[#0a0f1f] transition-colors duration-300">

        {/* Sidebar */}
        <Sidebar
          isOpen={isSidebarOpen}
          setIsOpen={setIsSidebarOpen}
        />

        {/* Content Area */}
        <div
          className={`flex-1 flex flex-col transition-all duration-300
            ${isSidebarOpen ? "md:ml-72" : "md:ml-20"}
          `}
        >
          {/* Main Content — no padding, no background; each page controls its own */}
          <main className="mt-16">
            {children}
          </main>

          {/* Footer */}
          {/* <Footer /> */}
        </div>
      </div>
    </>
  );
}
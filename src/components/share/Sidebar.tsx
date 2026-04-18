"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Menu, X, HandCoins, UserRound } from "lucide-react";
import { LogoutModal } from "../Dialogs/LogoutModal";
import { useState } from "react";

const navigation = [
  { name: "Dashboard Overview", href: "/", icon: LayoutDashboard },
  {
    name: "User Management",
    href: "/user-management",
    icon: UserRound ,
  },
  { name: "Participants/Entries", href: "/participants", icon: HandCoins },
  { name: "Campaigns", href: "/campaigns", icon: HandCoins },
  { name: "Winners/Draw Results", href: "/winners", icon: HandCoins },
   { name: "Withdrawal Request", href: "/withdrawal-request", icon: HandCoins },
   { name: "Campaign Applications", href: "/campaign-application", icon: HandCoins },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <>
      {/* Mobile Menu Button - শুধু mobile এ এবং sidebar close থাকলে দেখাবে */}
      {!isMobileMenuOpen && (
        <button
          onClick={toggleMobileMenu}
          className="lg:hidden fixed top-4 left-4 z-50 p-2.5 rounded-lg bg-[#212121] text-white shadow-lg hover:bg-[#313131] transition-colors"
          aria-label="Open menu"
        >
          <Menu className="h-6 w-6" />
        </button>
      )}

      {/* Overlay - mobile এ sidebar open থাকলে */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={toggleMobileMenu}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "flex h-screen sticky bottom-0 top-0 flex-col bg-[#181715] z-50 transition-transform duration-300 overflow-auto",
          // Mobile এ
          "fixed lg:static",
          "w-[240px] sm:w-[250px] lg:w-[300px]",
          // Mobile এ hide/show control
          isMobileMenuOpen
            ? "translate-x-0"
            : "-translate-x-full lg:translate-x-0",
        )}
      >
        {/* Header with Logo - Logo সবসময় center এ */}
        <div className="flex items-center justify-center relative px-4 mt-2">
          <div className="flex h-[60px] items-center gap-2">
            {/* <Image
              src="/images/logo.png"
              alt="Logo"
              width={80}
              height={80}
              className="object-contain w-full h-full"
            /> */}
            <h1 className="text-[#E9C349] text-2xl font-bold leading-[32px0] tracking-[0.6px] mt-5 pl-3">Wholeheart Campaigns</h1>
          </div>

          {/* Close Button - absolute position এ top right corner এ */}
          {isMobileMenuOpen && (
            <button
              onClick={toggleMobileMenu}
              className="lg:hidden absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-lg text-white hover:bg-slate-600/50 transition-colors"
              aria-label="Close menu"
            >
              <X className="h-6 w-6" />
            </button>
          )} 
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-3 flex flex-col items-center justify-start px-3 overflow-y-auto mt-10">
          {navigation.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={cn(
                  "flex w-[90%] mx-auto items-center justify-start gap-2 space-y-1 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-[#E9C34921] text-[#E9C349]"
                    : "text-[#787878] hover:bg-[#E9C34921] hover:text-[#E9C349 ] text-[18px]",
                )}
              >
                <item.icon
                  className={cn(
                    "h-5 w-5 sm:h-6 sm:w-6 transition-colors duration-200 flex-shrink-0",
                    isActive ? "text-[#E9C349]" : "",
                  )}
                />
                <span
                  className={cn(
                    "font-normal text-sm sm:text-base leading-[120%] transition-colors duration-200",
                    isActive ? "text-[#E9C349] font-medium text-[18px]" : "text-[18px]",
                  )}
                >
                  {item.name}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Logout fixed at bottom */}
        <div className="p-4 sm:p-6">
          <LogoutModal />
        </div>
      </div>
    </>
  );
}

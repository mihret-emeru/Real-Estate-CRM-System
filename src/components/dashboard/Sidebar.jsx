"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { FaSignOutAlt } from "react-icons/fa";

import { sidebarMenu } from "@/data/sidebarMenu";

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  // Default to client if session hasn't loaded yet
  const role = session?.user?.role || "client";

  const menuItems = sidebarMenu[role] || [];

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-header">
        <Image
          src="/images/logo.png"
          alt="Real Estate CRM"
          width={42}
          height={42}
          className="sidebar-logo"
        />

        <div className="sidebar-title">
          <h2>Real Estate CRM</h2>
        </div>
      </div>

      {/* Menu */}
      <nav className="sidebar-menu">
        <ul>
          {menuItems.map((item) => {
            const Icon = item.icon;

            return (
              <li key={item.title}>
                <Link
                  href={item.href}
                  className={pathname === item.href ? "active" : ""}
                >
                  <Icon />
                  <span>{item.title}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Logout */}
      <div className="sidebar-footer">
        <button
          className="logout-btn"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <FaSignOutAlt />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}

import {
  FaHome,
  FaUsers,
  FaCog,
  FaChartBar,
  FaBuilding,
  FaUserTie,
  FaFileContract,
  FaMoneyBillWave,
  FaChartLine,
  FaCalendarAlt,
  FaEnvelope,
  FaHeart,
} from "react-icons/fa";

export const sidebarMenu = {
  admin: [
    {
      title: "Dashboard",
      href: "/admin/dashboard",
      icon: FaHome,
    },
    {
      title: "User Management",
      href: "/admin/users",
      icon: FaUsers,
    },
    {
      title: "System Configuration",
      href: "/admin/settings",
      icon: FaCog,
    },
    {
      title: "Reports",
      href: "/admin/reports",
      icon: FaChartBar,
    },
  ],

  manager: [
    {
      title: "Dashboard",
      href: "/manager/dashboard",
      icon: FaHome,
    },
    {
      title: "Property Management",
      href: "/manager/properties",
      icon: FaBuilding,
    },
    {
      title: "Leads",
      href: "/manager/leads",
      icon: FaUserTie,
    },
    {
      title: "Contracts",
      href: "/manager/contracts",
      icon: FaFileContract,
    },
    {
      title: "Payments",
      href: "/manager/payments",
      icon: FaMoneyBillWave,
    },
    {
      title: "Reports",
      href: "/manager/reports",
      icon: FaChartBar,
    },
    {
      title: "Analytics",
      href: "/manager/analytics",
      icon: FaChartLine,
    },
  ],

  agent: [
    {
      title: "Dashboard",
      href: "/agent/dashboard",
      icon: FaHome,
    },
    {
      title: "Assigned Properties",
      href: "/agent/properties",
      icon: FaBuilding,
    },
    {
      title: "Leads",
      href: "/agent/leads",
      icon: FaUserTie,
    },
    {
      title: "Appointments",
      href: "/agent/appointments",
      icon: FaCalendarAlt,
    },
    {
      title: "Messages",
      href: "/agent/messages",
      icon: FaEnvelope,
    },
  ],

  client: [
    {
      title: "Dashboard",
      href: "/client/dashboard",
      icon: FaHome,
    },
    {
      title: "Properties",
      href: "/client/properties",
      icon: FaBuilding,
    },
    {
      title: "Favorites",
      href: "/client/favorites",
      icon: FaHeart,
    },
    {
      title: "Contracts",
      href: "/client/contracts",
      icon: FaFileContract,
    },
    {
      title: "Payments",
      href: "/client/payments",
      icon: FaMoneyBillWave,
    },
    {
      title: "Messages",
      href: "/client/messages",
      icon: FaEnvelope,
    },
  ],
};

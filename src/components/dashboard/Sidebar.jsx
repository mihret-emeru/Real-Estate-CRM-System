"use client";

import Image from "next/image";
import {
  FaHome,
  FaBuilding,
  FaHeart,
  FaFileContract,
  FaMoneyBillWave,
  FaEnvelope,
  FaUser,
} from "react-icons/fa";

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <Image
          src="/images/logo.png"
          alt="Real Estate CRM"
          width={60}
          height={60}
          className="sidebar-logo"
        />

        <h2>Real Estate CRM</h2>
      </div>

      <nav className="sidebar-menu">
        <ul>
          <li>
            <a href="#">
              <FaHome />
              <span>Dashboard</span>
            </a>
          </li>

          <li>
            <a href="#">
              <FaBuilding />
              <span>Properties</span>
            </a>
          </li>

          <li>
            <a href="#">
              <FaHeart />
              <span>Favorites</span>
            </a>
          </li>

          <li>
            <a href="#">
              <FaFileContract />
              <span>Contracts</span>
            </a>
          </li>

          <li>
            <a href="#">
              <FaMoneyBillWave />
              <span>Payments</span>
            </a>
          </li>

          <li>
            <a href="#">
              <FaEnvelope />
              <span>Messages</span>
            </a>
          </li>

          <li>
            <a href="#">
              <FaUser />
              <span>Profile</span>
            </a>
          </li>
        </ul>
      </nav>
    </aside>
  );
}


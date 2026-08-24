"use client";
import { FaSearch, FaBell, FaChevronDown } from "react-icons/fa";

export default function TopNavbar() {
  return (
    <header className="top-navbar">
      <div className="top-navbar-left">
        <div className="search-box">
          <FaSearch className="search-icon" />

          <input type="text" placeholder="Search properties..." />
        </div>
      </div>

      <div className="top-navbar-right">
        <button className="nav-icon-btn">
          <FaBell />
        </button>

        <div className="user-profile">
          <div className="user-avatar">M</div>

          <div className="user-info">
            <h4>Mercy</h4>
            <span>Client</span>
          </div>

          <FaChevronDown className="dropdown-icon" />
        </div>
      </div>
    </header>
  );
}

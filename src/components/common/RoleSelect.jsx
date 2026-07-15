"use client";

import { useState, useRef, useEffect } from "react";
import { FaUserTie, FaUser, FaBuilding, FaUserShield } from "react-icons/fa";
import { FiChevronDown } from "react-icons/fi";

const roles = [
  {
    value: "client",
    label: "Client",
    icon: <FaUser />,
  },
  {
    value: "agent",
    label: "Agent",
    icon: <FaUserTie />,
  },
  {
    value: "manager",
    label: "Manager",
    icon: <FaBuilding />,
  },
  {
    value: "admin",
    label: "Administrator",
    icon: <FaUserShield />,
  },
];

export default function RoleSelect({ value, onChange }) {
  const [open, setOpen] = useState(false);

  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selected = roles.find((role) => role.value === value) || null;

  return (
    <div className="role-select" ref={dropdownRef}>
      <div className="role-select-header" onClick={() => setOpen(!open)}>
        <div className="role-selected">
          {selected ? (
            <>
              {selected.icon}
              <span>{selected.label}</span>
            </>
          ) : (
            <span className="placeholder">Select your role</span>
          )}
        </div>

        <FiChevronDown className={`role-arrow ${open ? "rotate" : ""}`} />
      </div>

      {open && (
        <div className="role-dropdown">
          {roles.map((role) => (
            <div
              key={role.value}
              className={`role-option ${
                value === role.value ? "active-role" : ""
              }`}
              onClick={() => {
                onChange(role.value);
                setOpen(false);
              }}
            >
              {role.icon}

              <span>{role.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useRef, useEffect } from "react";
import "@/styles/custom-dropdown.css";

export default function CustomDropdown({
  icon,
  value,
  options,
  onChange,
  placeholder = "Select",
}) {
  const [open, setOpen] = useState(false);

  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const selectedOption = options.find((option) => option.value === value);

  return (
    <div className="custom-dropdown" ref={dropdownRef}>
      <button
        type="button"
        className="custom-dropdown-button"
        onClick={() => setOpen(!open)}
      >
        {icon && <span className="custom-dropdown-icon">{icon}</span>}

        <span>{selectedOption ? selectedOption.label : placeholder}</span>

        <span className="custom-dropdown-arrow">⌄</span>
      </button>

      {open && (
        <div className="custom-dropdown-menu">
          {options.map((option) => (
            <div
              key={option.value}
              className={`custom-dropdown-item ${
                value === option.value ? "active" : ""
              }`}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

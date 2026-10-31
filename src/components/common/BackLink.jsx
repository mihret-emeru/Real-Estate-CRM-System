"use client";

import Link from "next/link";
import { FiArrowLeft } from "react-icons/fi";

import "@/styles/back-link.css";

export default function BackLink({ href, label = "Go Back" }) {
  return (
    <Link href={href} className="back-link">
      <FiArrowLeft className="back-link-icon" aria-hidden="true" />
      <span>{label}</span>
    </Link>
  );
}

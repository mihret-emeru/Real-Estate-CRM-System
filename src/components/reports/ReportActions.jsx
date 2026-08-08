"use client";

import { FaFilePdf, FaFileExcel } from "react-icons/fa";

export default function ReportActions({
  onExportPDF,
  onExportExcel,
  hasReport = false,
}) {
  return (
    <div className="report-actions">
      <button
        type="button"
        className="export-pdf-btn"
        onClick={onExportPDF}
        disabled={!hasReport}
      >
        <FaFilePdf />
        <span>Export PDF</span>
      </button>

      <button
        type="button"
        className="export-excel-btn"
        onClick={onExportExcel}
        disabled={!hasReport}
      >
        <FaFileExcel />
        <span>Export Excel</span>
      </button>
    </div>
  );
}


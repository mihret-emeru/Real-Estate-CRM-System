import { FaChartBar } from "react-icons/fa";

export default function ReportHeader() {
  return (
    <div className="report-header">
      <div className="report-header-icon">
        <FaChartBar />
      </div>

      <div>
        <h1>Reports</h1>

        <p>Generate and analyze your real estate business performance.</p>
      </div>
    </div>
  );
}


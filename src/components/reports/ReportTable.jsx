import "@/styles/report-table.css";
export default function ReportTable({ title, columns = [], data = [] }) {
  function renderCell(row, column) {
    let value;

    if (column.render) {
      value = column.render(row);
    } else {
      value = row[column.key];
    }

    if (value === null || value === undefined || value === "") {
      return "-";
    }

    if (
      typeof value === "string" &&
      !Number.isNaN(Date.parse(value)) &&
      (column.key.toLowerCase().includes("date") ||
        column.key.toLowerCase().includes("createdat") ||
        column.key.toLowerCase().includes("updatedat"))
    ) {
      const date = new Date(value);

      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }

    if (typeof value === "object") {
      return value.name || value.title || value.email || "-";
    }

    return value;
  }

  return (
    <div className="report-table-section">
      {title && <h2>{title}</h2>}

      {data.length === 0 ? (
        <p className="report-table-empty">No data available for this report.</p>
      ) : (
        <div className="report-table-wrapper">
          <table className="report-table">
            <thead>
              <tr>
                {columns.map((column) => (
                  <th key={column.key}>{column.label}</th>
                ))}
              </tr>
            </thead>

            <tbody>
              {data.map((row, rowIndex) => (
                <tr key={row._id || row.id || rowIndex}>
                  {columns.map((column) => (
                    <td key={column.key}>{renderCell(row, column)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

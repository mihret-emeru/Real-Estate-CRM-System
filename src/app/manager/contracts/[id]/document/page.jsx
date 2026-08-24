"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import PDFViewer from "@/components/contracts/PDFViewer";
import Link from "next/link";

export default function ContractDocumentPage() {
  const { id } = useParams();

  const [contract, setContract] = useState(null);

  useEffect(() => {
    async function loadContract() {
      const response = await fetch(`/api/contracts/${id}`);

      const result = await response.json();

      if (result.success) {
        setContract(result.data);
      }
    }

    loadContract();
  }, [id]);

  if (!contract) {
    return <h2>Loading...</h2>;
  }

  return (
    <div style={{ padding: "20px" }}>
      <Link href={`/manager/contracts/${id}`} className="back-link">
        ← Back to Contract Details
      </Link>
      <h1>Signed Contract</h1>

      <PDFViewer fileUrl={contract.document.fileUrl} />
    </div>
  );
}

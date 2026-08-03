"use client";

import { useState } from "react";

export default function ContractDocument({ contract, onUpdate }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  async function handleUpload() {
    if (!file) {
      alert("Please select a PDF file");
      return;
    }

    try {
      setUploading(true);

      // 1. Upload PDF to Cloudinary
      const uploadData = new FormData();

      uploadData.append("file", file);

      const uploadResponse = await fetch("/api/upload/contract", {
        method: "POST",
        body: uploadData,
      });

      const uploadResult = await uploadResponse.json();

      if (!uploadResult.success) {
        alert(uploadResult.message);
        return;
      }

      // 2. Save document information in Contract
      const documentData = {
        document: {
          fileName: uploadResult.data.fileName,

          fileUrl: uploadResult.data.fileUrl,

          mimeType: uploadResult.data.mimeType,

          uploadedAt: new Date(),
        },

        contractType: "uploaded",

        status: "pending_signature",
      };

      const updateResponse = await fetch(`/api/contracts/${contract._id}`, {
        method: "PUT",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify(documentData),
      });

      const updateResult = await updateResponse.json();

      if (updateResult.success) {
        alert("Contract uploaded successfully");

        onUpdate(updateResult.data);
      }
    } catch (error) {
      console.error(error);

      alert("Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="contract-document">
      <h2>Contract Document</h2>

      {contract.document?.fileUrl ? (
        <div>
          <p>{contract.document.fileName}</p>

          <a href={contract.document.fileUrl} target="_blank">
            View Document
          </a>
        </div>
      ) : (
        <p>No signed contract uploaded yet.</p>
      )}

      <input
        type="file"
        accept="application/pdf"
        onChange={(e) => setFile(e.target.files[0])}
      />

      <button type="button" onClick={handleUpload} disabled={uploading}>
        {uploading ? "Uploading..." : "Upload Signed Contract"}
      </button>
    </div>
  );
}


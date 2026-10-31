export async function uploadContractFile(file) {
  const formData = new FormData();

  formData.append("file", file);

  const response = await fetch("/api/upload/contract", {
    method: "POST",
    body: formData,
  });

  return await response.json();
}

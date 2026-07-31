export async function getContracts() {
  const response = await fetch("/api/contracts");

  const data = await response.json();

  return data;
}

export async function getContract(id) {
  const response = await fetch(`/api/contracts/${id}`);

  const data = await response.json();

  return data;
}

export async function createContract(contractData) {
  const response = await fetch("/api/contracts", {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
    },

    body: JSON.stringify(contractData),
  });

  const data = await response.json();

  return data;
}

export async function updateContract(id, contractData) {
  const response = await fetch(`/api/contracts/${id}`, {
    method: "PUT",

    headers: {
      "Content-Type": "application/json",
    },

    body: JSON.stringify(contractData),
  });

  const data = await response.json();

  return data;
}

export async function deleteContract(id) {
  const response = await fetch(`/api/contracts/${id}`, {
    method: "DELETE",
  });

  const data = await response.json();

  return data;
}


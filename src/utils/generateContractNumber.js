import Contract from "@/models/Contract";

export default async function generateContractNumber() {
  const year = new Date().getFullYear();

  const count = await Contract.countDocuments();

  const sequence = String(count + 1).padStart(4, "0");

  return `CTR-${year}-${sequence}`;
}

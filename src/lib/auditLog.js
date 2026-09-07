import AuditLog from "@/models/AuditLog";

export async function createAuditLog({
  action,
  module,
  description = "",
  user = null,
  targetId = null,
  targetModel = "",
  metadata = {},
  request = null,
}) {
  try {
    let ipAddress = "";
    let userAgent = "";

    if (request) {
      const forwardedFor = request.headers.get("x-forwarded-for");

      ipAddress =
        forwardedFor?.split(",")[0]?.trim() ||
        request.headers.get("x-real-ip") ||
        "";

      userAgent = request.headers.get("user-agent") || "";
    }

    return await AuditLog.create({
      action,
      module,
      description,
      user,
      targetId,
      targetModel,
      metadata,
      ipAddress,
      userAgent,
    });
  } catch (error) {
    console.error("Failed to create audit log:", error);

    return null;
  }
}


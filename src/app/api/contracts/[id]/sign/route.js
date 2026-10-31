import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";

import Contract from "@/models/Contract";
import Lead from "@/models/Lead";
import Property from "@/models/Property";

export async function POST(request, { params }) {
  try {
    await connectDB();

    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized.",
        },
        { status: 401 },
      );
    }

    if (session.user.role !== "client") {
      return NextResponse.json(
        {
          success: false,
          message: "Only clients can sign contracts.",
        },
        { status: 403 },
      );
    }

    const { id } = await params;

    const body = await request.json();

    const { signature } = body;

    if (!signature) {
      return NextResponse.json(
        {
          success: false,
          message: "Signature is required.",
        },
        { status: 400 },
      );
    }

    const contract = await Contract.findById(id);

    if (!contract) {
      return NextResponse.json(
        {
          success: false,
          message: "Contract not found.",
        },
        { status: 404 },
      );
    }

    /*
     * Make sure this contract belongs
     * to the currently logged-in client.
     */

    if (String(contract.client) !== String(session.user.id)) {
      return NextResponse.json(
        {
          success: false,
          message: "You are not authorized to sign this contract.",
        },
        { status: 403 },
      );
    }

    /*
     * Only generated contracts require
     * client signing.
     */

    if (contract.contractType !== "generated") {
      return NextResponse.json(
        {
          success: false,
          message: "Only generated contracts can be signed here.",
        },
        { status: 400 },
      );
    }

    if (contract.status !== "pending_signature") {
      return NextResponse.json(
        {
          success: false,
          message: "This contract is no longer awaiting signature.",
        },
        { status: 400 },
      );
    }

    /*
     * Save signature.
     */

    contract.clientSignature = signature;
    contract.clientSignedAt = new Date();

    contract.status = "signed";

    await contract.save();

    /*
     * Property becomes sold after
     * client signs the generated contract.
     */

    await Property.findByIdAndUpdate(contract.property, {
      status: "sold",
    });
    // Update lead score and status when the property is sold.
    const property = await Property.findById(contract.property);

    let lead = null;

    // Prefer the lead explicitly linked to this contract.
    if (contract.lead) {
      lead = await Lead.findById(contract.lead);
    }

    // Fall back to the client's lead if no linked lead was found.
    if (!lead && contract.client) {
      lead = await Lead.findOne({
        client: contract.client,
      });
    }

    if (lead && lead.status !== "won") {
      const oldStatus = lead.status;

      lead.leadScore = 100;
      lead.status = "won";

      lead.activities.push({
        type: "status_change",
        message: `Lead marked as won because the client purchased ${property?.title || "the property"}.`,
        oldValue: oldStatus,
        newValue: "won",
        createdAt: new Date(),
      });

      await lead.save();
    }

    return NextResponse.json({
      success: true,
      message: "Contract signed successfully.",
      data: contract,
    });
  } catch (error) {
    console.error("Contract signing error:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message,
      },
      { status: 500 },
    );
  }
}

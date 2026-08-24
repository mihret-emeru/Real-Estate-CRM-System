import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";

import Contract from "@/models/Contract";
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

    /*
     * ==========================================
     * FIND CONTRACT
     * ==========================================
     */

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
     * ==========================================
     * VERIFY CLIENT
     * ==========================================
     *
     * The client signing the contract must be
     * the client assigned to that contract.
     */

    if (
      !contract.client ||
      String(contract.client) !== String(session.user.id)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "You are not authorized to sign this contract.",
        },
        { status: 403 },
      );
    }

    /*
     * ==========================================
     * ONLY GENERATED CONTRACTS CAN BE SIGNED
     * ==========================================
     */

    if (contract.contractType !== "generated") {
      return NextResponse.json(
        {
          success: false,
          message: "Uploaded contracts do not require online signing.",
        },
        { status: 400 },
      );
    }

    /*
     * ==========================================
     * CONTRACT MUST BE PENDING SIGNATURE
     * ==========================================
     */

    if (contract.status !== "pending_signature") {
      return NextResponse.json(
        {
          success: false,
          message:
            contract.status === "signed"
              ? "This contract has already been signed."
              : "This contract cannot be signed in its current status.",
        },
        { status: 409 },
      );
    }

    /*
     * ==========================================
     * SAVE SIGNATURE
     * ==========================================
     */

    contract.signature = {
      imageUrl: signature,
      signedAt: new Date(),
      signedBy: session.user.id,
    };

    contract.status = "signed";

    await contract.save();

    /*
     * ==========================================
     * UPDATE PROPERTY
     * ==========================================
     */

    if (contract.property) {
      await Property.findByIdAndUpdate(contract.property, {
        status: "sold",
      });
    }

    /*
     * ==========================================
     * RESPONSE
     * ==========================================
     */

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

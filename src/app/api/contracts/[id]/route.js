import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Contract from "@/models/Contract";
import Property from "@/models/Property";

export async function GET(request, { params }) {
  try {
    await connectDB();

    const { id } = await params;

    console.log("Contract ID:", id);

    const contract = await Contract.findById(id)
      .populate("client", "name email phone")
      .populate("lead", "fullName email phone status")
      .populate("property", "title price")
      .populate("manager", "name email");

    console.log(contract);

    if (!contract) {
      return NextResponse.json(
        {
          success: false,
          message: "Contract not found",
        },
        {
          status: 404,
        },
      );
    }

    return NextResponse.json({
      success: true,
      data: contract,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message: error.message,
      },
      {
        status: 500,
      },
    );
  }
}
export async function PUT(request, { params }) {
  try {
    await connectDB();

    const { id } = await params;

    const body = await request.json();

    const contract = await Contract.findById(id);

    if (!contract) {
      return NextResponse.json(
        {
          success: false,
          message: "Contract not found",
        },
        {
          status: 404,
        },
      );
    }

    // ==========================================
    // Update contract
    // ==========================================

    Object.assign(contract, body);

    await contract.save();

    // ==========================================
    // Update property according to contract status
    // ==========================================

    const property = await Property.findById(contract.property);

    if (property) {
      if (contract.status === "pending_signature") {
        property.status = "reserved";
      }

      if (contract.status === "signed" || contract.status === "completed") {
        property.status = "sold";
      }

      if (contract.status === "cancelled") {
        property.status = "available";
      }

      await property.save();
    }

    return NextResponse.json({
      success: true,
      data: contract,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message: error.message,
      },
      {
        status: 500,
      },
    );
  }
}
export async function DELETE(request, { params }) {
  try {
    await connectDB();

    const { id } = await params;

    const contract = await Contract.findById(id);

    if (!contract) {
      return NextResponse.json(
        {
          success: false,
          message: "Contract not found",
        },
        {
          status: 404,
        },
      );
    }

    await Contract.findByIdAndDelete(id);

    await Property.findByIdAndUpdate(contract.property, {
      status: "available",
    });
    return NextResponse.json({
      success: true,
      message: "Contract deleted successfully and property is available again.",
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message: error.message,
      },
      {
        status: 500,
      },
    );
  }
}

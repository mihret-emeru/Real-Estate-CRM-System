import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Contract from "@/models/Contract";

export async function GET(request, { params }) {
  try {
    await connectDB();

    const { id } = await params;

    console.log("Contract ID:", id);

    const contract = await Contract.findById(id)
      .populate("client", "name email phone")
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

    const updatedContract = await Contract.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    });

    if (!updatedContract) {
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
      data: updatedContract,
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

    const deletedContract = await Contract.findByIdAndDelete(id);

    if (!deletedContract) {
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

    return NextResponse.json(
      {
        success: true,
        message: "Contract deleted successfully",
      },
      {
        status: 200,
      },
    );
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

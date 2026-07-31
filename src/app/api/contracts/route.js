import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Contract from "@/models/Contract";
import generateContractNumber from "@/utils/generateContractNumber";

export async function POST(request) {
  try {
    await connectDB();

    const body = await request.json();

    const contractNumber = await generateContractNumber();

    const remainingBalance =
      Number(body.salePrice) - Number(body.downPayment || 0);

    const contract = await Contract.create({
      ...body,

      contractNumber,

      remainingBalance,
    });

    return NextResponse.json(
      {
        success: true,
        data: contract,
      },
      {
        status: 201,
      },
    );
  } catch (error) {
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

export async function GET() {
  try {
    await connectDB();

    const contracts = await Contract.find()
      .populate("client", "name email")
      .populate("property", "title price")
      .populate("manager", "name email")
      .sort({ createdAt: -1 });

    return NextResponse.json(
      {
        success: true,
        data: contracts,
      },
      {
        status: 200,
      },
    );
  } catch (error) {
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


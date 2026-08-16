import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Contract from "@/models/Contract";
import Property from "@/models/Property";
import Payment from "@/models/Payment";
import generateContractNumber from "@/utils/generateContractNumber";

export async function POST(request) {
  try {
    await connectDB();

    const body = await request.json();

    if (!body.property) {
      return NextResponse.json(
        {
          success: false,
          message: "Property is required.",
        },
        { status: 400 },
      );
    }

    // ==========================================
    // Check property availability
    // ==========================================

    const property = await Property.findById(body.property);

    if (!property) {
      return NextResponse.json(
        {
          success: false,
          message: "Property not found.",
        },
        { status: 404 },
      );
    }

    if (property.status !== "available") {
      return NextResponse.json(
        {
          success: false,
          message:
            property.status === "reserved"
              ? "This property is already reserved."
              : "This property has already been sold.",
        },
        { status: 409 },
      );
    }

    // ==========================================
    // Generate contract number
    // ==========================================

    const contractNumber = await generateContractNumber();

    let contractData = {
      ...body,
      contractNumber,
      status: body.contractType === "uploaded" ? "signed" : "pending_signature",
    };

    // ==========================================
    // Generated Contract
    // ==========================================

    if (body.contractType === "generated") {
      contractData.remainingBalance =
        Number(body.salePrice) - Number(body.downPayment || 0);
    }

    // ==========================================
    // Uploaded Contract
    // ==========================================

    if (body.contractType === "uploaded") {
      contractData.salePrice = Number(body.salePrice || 0);

      contractData.downPayment = Number(body.downPayment || 0);

      contractData.remainingBalance = Number(body.remainingBalance || 0);

      contractData.installmentMonths = Number(body.installmentMonths || 0);

      contractData.installmentAmount = Number(body.installmentAmount || 0);

      contractData.paymentFrequency = body.paymentFrequency || "monthly";

      contractData.paymentSchedule = Array.isArray(body.paymentSchedule)
        ? body.paymentSchedule
        : [];
    }

    // ==========================================
    // Create Contract
    // ==========================================

    const contract = await Contract.create(contractData);

    // ==========================================
    // Update Property Status
    // ==========================================

    if (contract.status === "pending_signature") {
      property.status = "reserved";
    }

    if (contract.status === "signed" || contract.status === "completed") {
      property.status = "sold";
    }

    await property.save();

    // ==========================================
    // Create Payment Records Automatically
    // ==========================================

    if (contract.paymentSchedule && contract.paymentSchedule.length > 0) {
      const payments = contract.paymentSchedule.map((item) => ({
        contract: contract._id,

        client: contract.client || null,

        lead: contract.lead || null,

        property: contract.property,

        installmentNumber: item.installmentNumber,

        dueDate: item.dueDate,

        expectedAmount: item.amount,
      }));

      await Payment.insertMany(payments);
    }

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

export async function GET() {
  try {
    await connectDB();

    const contracts = await Contract.find()
      .populate("client", "name email")
      .populate("lead", "fullName email phone status")
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

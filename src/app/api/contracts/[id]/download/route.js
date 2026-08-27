import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";

import Contract from "@/models/Contract";

export async function GET(request, { params }) {
  try {
    await connectDB();

    /*
     * ==========================================
     * AUTHENTICATION
     * ==========================================
     */

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
          message: "Only clients can download contracts.",
        },
        { status: 403 },
      );
    }

    /*
     * ==========================================
     * GET CONTRACT ID
     * ==========================================
     */

    const { id } = await params;

    /*
     * ==========================================
     * GET CONTRACT
     * ==========================================
     */

    const contract = await Contract.findById(id)
      .populate("client", "name email phone")
      .populate("property", "title price currency")
      .populate("manager", "name email");

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
     * AUTHORIZATION
     * ==========================================
     *
     * A client can only download their own
     * contract.
     */

    if (String(contract.client?._id) !== String(session.user.id)) {
      return NextResponse.json(
        {
          success: false,
          message: "You are not authorized to download this contract.",
        },
        { status: 403 },
      );
    }

    /*
     * ==========================================
     * ONLY GENERATED CONTRACTS
     * ==========================================
     */

    if (contract.contractType !== "generated") {
      return NextResponse.json(
        {
          success: false,
          message: "This download endpoint is only for generated contracts.",
        },
        { status: 400 },
      );
    }

    /*
     * ==========================================
     * CONTRACT MUST BE SIGNED
     * ==========================================
     */

    if (contract.status !== "signed" && contract.status !== "completed") {
      return NextResponse.json(
        {
          success: false,
          message: "The contract must be signed before downloading.",
        },
        { status: 400 },
      );
    }

    /*
     * ==========================================
     * SIGNATURE CHECK
     * ==========================================
     */

    if (!contract.clientSignature) {
      return NextResponse.json(
        {
          success: false,
          message: "Client signature was not found.",
        },
        { status: 400 },
      );
    }

    /*
     * ==========================================
     * CREATE PDF
     * ==========================================
     */

    const pdfDoc = await PDFDocument.create();

    const page = pdfDoc.addPage([595.28, 841.89]);

    const { width, height } = page.getSize();

    const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    /*
     * ==========================================
     * COLORS
     * ==========================================
     */

    const dark = rgb(0.12, 0.12, 0.12);

    const gray = rgb(0.45, 0.45, 0.45);

    const lightGray = rgb(0.9, 0.9, 0.9);

    /*
     * ==========================================
     * HELPERS
     * ==========================================
     */

    function drawText(text, x, y, options = {}) {
      page.drawText(String(text ?? ""), {
        x,
        y,
        size: options.size || 10,
        font: options.bold ? boldFont : regularFont,
        color: options.color || dark,
      });
    }

    function drawLine(y) {
      page.drawLine({
        start: {
          x: 50,
          y,
        },
        end: {
          x: width - 50,
          y,
        },
        thickness: 1,
        color: lightGray,
      });
    }

    function formatMoney(value) {
      return Number(value || 0).toLocaleString();
    }

    /*
     * ==========================================
     * HEADER
     * ==========================================
     */

    drawText("REAL ESTATE CONTRACT", 50, height - 60, {
      size: 20,
      bold: true,
    });

    drawText(contract.contractNumber, 50, height - 82, {
      size: 10,
      color: gray,
    });

    drawLine(height - 105);

    /*
     * ==========================================
     * CONTRACT INFORMATION
     * ==========================================
     */

    let y = height - 140;

    drawText("CONTRACT INFORMATION", 50, y, {
      size: 13,
      bold: true,
    });

    y -= 30;

    drawText("Client:", 50, y, {
      bold: true,
    });

    drawText(contract.client?.name || "-", 170, y);

    y -= 20;

    drawText("Email:", 50, y, {
      bold: true,
    });

    drawText(contract.client?.email || "-", 170, y);

    y -= 20;

    drawText("Phone:", 50, y, {
      bold: true,
    });

    drawText(contract.client?.phone || "-", 170, y);

    y -= 30;

    drawLine(y);

    /*
     * ==========================================
     * PROPERTY INFORMATION
     * ==========================================
     */

    y -= 30;

    drawText("PROPERTY", 50, y, {
      size: 13,
      bold: true,
    });

    y -= 30;

    drawText("Property:", 50, y, {
      bold: true,
    });

    drawText(contract.property?.title || "-", 170, y);

    y -= 20;

    drawText("Sale Price:", 50, y, {
      bold: true,
    });

    drawText(
      `${formatMoney(contract.salePrice)} ${contract.property?.currency || "ETB"}`,
      170,
      y,
    );

    y -= 20;

    drawText("Down Payment:", 50, y, {
      bold: true,
    });

    drawText(
      `${formatMoney(contract.downPayment)} ${contract.property?.currency || "ETB"}`,
      170,
      y,
    );

    y -= 20;

    drawText("Remaining Balance:", 50, y, {
      bold: true,
    });

    drawText(
      `${formatMoney(contract.remainingBalance)} ${contract.property?.currency || "ETB"}`,
      170,
      y,
    );

    /*
     * ==========================================
     * TERMS
     * ==========================================
     */

    y -= 40;

    drawLine(y);

    y -= 30;

    drawText("TERMS AND CONDITIONS", 50, y, {
      size: 13,
      bold: true,
    });

    y -= 25;

    const terms =
      contract.terms ||
      "The client agrees to the terms and conditions of this property sale agreement.";

    /*
     * Simple text wrapping.
     */

    const words = terms.split(" ");

    let line = "";

    for (const word of words) {
      const testLine = line ? `${line} ${word}` : word;

      const textWidth = regularFont.widthOfTextAtSize(testLine, 10);

      if (textWidth > width - 100) {
        drawText(line, 50, y, {
          size: 10,
        });

        y -= 16;

        line = word;
      } else {
        line = testLine;
      }
    }

    if (line) {
      drawText(line, 50, y, {
        size: 10,
      });

      y -= 16;
    }

    /*
     * ==========================================
     * SIGNATURE SECTION
     * ==========================================
     */

    y -= 35;

    drawLine(y);

    y -= 35;

    drawText("SIGNATURES", 50, y, {
      size: 13,
      bold: true,
    });

    y -= 40;

    /*
     * Client signature
     */

    drawText("Client Signature", 50, y, {
      bold: true,
    });

    /*
     * Convert base64 signature into PNG.
     */

    const signatureData = contract.clientSignature;

    const base64Data = signatureData.split(",")[1];

    if (!base64Data) {
      throw new Error("Invalid client signature format.");
    }

    const signatureBytes = Buffer.from(base64Data, "base64");

    const signatureImage = await pdfDoc.embedPng(signatureBytes);

    page.drawImage(signatureImage, {
      x: 50,
      y: y - 70,
      width: 180,
      height: 60,
    });

    page.drawLine({
      start: {
        x: 50,
        y: y - 75,
      },
      end: {
        x: 250,
        y: y - 75,
      },
      thickness: 1,
      color: dark,
    });

    drawText(contract.client?.name || "Client", 50, y - 95, {
      size: 9,
    });

    if (contract.clientSignedAt) {
      drawText(
        `Signed: ${new Date(contract.clientSignedAt).toLocaleDateString()}`,
        50,
        y - 110,
        {
          size: 8,
          color: gray,
        },
      );
    }

    /*
     * ==========================================
     * MANAGER
     * ==========================================
     */

    drawText("Manager", 350, y, {
      bold: true,
    });

    page.drawLine({
      start: {
        x: 350,
        y: y - 75,
      },
      end: {
        x: 545,
        y: y - 75,
      },
      thickness: 1,
      color: dark,
    });

    drawText(contract.manager?.name || "Manager", 350, y - 95, {
      size: 9,
    });

    /*
     * ==========================================
     * FOOTER
     * ==========================================
     */

    drawText("Generated by Real Estate CRM System", 50, 30, {
      size: 8,
      color: gray,
    });

    /*
     * ==========================================
     * SAVE PDF
     * ==========================================
     */

    const pdfBytes = await pdfDoc.save();

    return new NextResponse(pdfBytes, {
      status: 200,

      headers: {
        "Content-Type": "application/pdf",

        "Content-Disposition": `attachment; filename="contract-${contract.contractNumber}.pdf"`,

        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Contract PDF download error:", error);

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

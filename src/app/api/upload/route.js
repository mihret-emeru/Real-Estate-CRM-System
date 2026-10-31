import { NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";

export async function POST(request) {
  try {
    const formData = await request.formData();

    const files = formData.getAll("images");

    const uploadPromises = files.map(async (file) => {
      const bytes = await file.arrayBuffer();

      const buffer = Buffer.from(bytes);

      return new Promise((resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            {
              folder: "real-estate-properties",
            },

            (error, result) => {
              if (error) {
                reject(error);
              }

              resolve(result.secure_url);
            },
          )
          .end(buffer);
      });
    });

    const imageUrls = await Promise.all(uploadPromises);

    return NextResponse.json({
      success: true,
      images: imageUrls,
    });
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

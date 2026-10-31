import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import cloudinary from "@/lib/cloudinary";

export async function POST(request) {
  try {
    // 1. Verify the logged-in user
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          message: "Please log in to upload a profile photo.",
        },
        { status: 401 },
      );
    }

    // 2. Read and validate the uploaded image
    const formData = await request.formData();
    const file = formData.get("photo");

    if (!file || typeof file.arrayBuffer !== "function") {
      return NextResponse.json(
        { success: false, message: "Please select a photo." },
        { status: 400 },
      );
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          message: "Only JPG, PNG, and WebP images are allowed.",
        },
        { status: 400 },
      );
    }

    const maxSize = 5 * 1024 * 1024;

    if (file.size === 0 || file.size > maxSize) {
      return NextResponse.json(
        {
          success: false,
          message: "Photo must be smaller than 5 MB.",
        },
        { status: 400 },
      );
    }

    // 3. Confirm that the user exists
    await connectDB();

    const user = await User.findById(session.user.id);

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found." },
        { status: 404 },
      );
    }

    // 4. Upload the image to Cloudinary
    const buffer = Buffer.from(await file.arrayBuffer());

    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: "real-estate-profile-photos",
            public_id: String(user._id),
            overwrite: true,
            resource_type: "image",
            transformation: [{ width: 500, height: 500, crop: "limit" }],
          },
          (error, uploadedImage) => {
            if (error) {
              reject(error);
              return;
            }

            if (!uploadedImage?.secure_url) {
              reject(new Error("Cloudinary did not return an image URL."));
              return;
            }

            resolve(uploadedImage);
          },
        )
        .end(buffer);
    });

    // 5. Save the photo URL to the user's profile
    user.profileImage = result.secure_url;
    await user.save();

    return NextResponse.json({
      success: true,
      message: "Profile photo uploaded successfully.",
      data: {
        profileImage: user.profileImage,
      },
    });
  } catch (error) {
    console.error("Profile photo upload error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to upload profile photo.",
      },
      { status: 500 },
    );
  }
}

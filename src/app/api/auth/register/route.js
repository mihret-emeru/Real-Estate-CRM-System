import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import Lead from "@/models/Lead";

export async function POST(request) {
  try {
    // Connect to database
    await connectDB();

    // Get request data
    const body = await request.json();

    const {
      name,
      email,
      phone,
      password,
      city,
      preferredPropertyType,
      minBudget,
      maxBudget,
      currency,
    } = body;

    // Check required fields
    if (!name || !email || !password) {
      return Response.json(
        {
          success: false,
          message: "Name, email and password are required",
        },
        {
          status: 400,
        },
      );
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      email,
    });

    if (existingUser) {
      return Response.json(
        {
          success: false,
          message: "Email already exists",
        },
        {
          status: 400,
        },
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new client
    const user = await User.create({
      name,
      email,
      phone,

      password: hashedPassword,

      role: "client",

      city,
      preferredPropertyType,
      minBudget,
      maxBudget,
      currency,
    });

    // Create automatic lead
    await Lead.create({
      fullName: user.name,
      email: user.email,
      phone: user.phone,
      source: "client_registration",
      status: "new",
      leadScore: 10,
      client: user._id,
    });

    return Response.json(
      {
        success: true,
        message: "Client account created successfully",
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    return Response.json(
      {
        success: false,
        message: "Registration failed",
        error: error.message,
      },
      {
        status: 500,
      },
    );
  }
}

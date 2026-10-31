import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import dbConnect from "@/lib/mongodb";
import SystemConfiguration from "@/models/SystemConfiguration";
import { authOptions } from "@/lib/auth";

const defaultProperties = {
  propertyManagementEnabled: true,
  allowNewListings: true,
  requireImages: true,
  minimumImages: 1,
  defaultStatus: "available",
  defaultCurrency: "ETB",
  defaultPropertyType: "apartment",
  allowEditing: true,
  allowDeletion: true,
  requireDescription: true,
  requireLocation: true,
  recommendationsEnabled: true,
  virtualToursEnabled: true,
  favoritesEnabled: true,
};

async function checkAdmin() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return false;
  }

  return session.user.role === "admin";
}

function normalizeProperties(properties) {
  const source = properties?.toObject?.() || properties || {};

  return {
    ...defaultProperties,
    ...source,
  };
}

export async function GET() {
  try {
    const isAdmin = await checkAdmin();

    if (!isAdmin) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        {
          status: 401,
        },
      );
    }

    await dbConnect();

    let settings = await SystemConfiguration.findOne();

    if (!settings) {
      settings = await SystemConfiguration.create({
        ...defaultProperties,
        properties: defaultProperties,
      });
    }

    const properties = normalizeProperties(settings.properties);

    return NextResponse.json({
      success: true,
      data: properties,
    });
  } catch (error) {
    console.error("Failed to load property settings:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load property settings",
      },
      {
        status: 500,
      },
    );
  }
}

export async function PUT(request) {
  try {
    const isAdmin = await checkAdmin();

    if (!isAdmin) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        {
          status: 401,
        },
      );
    }

    const body = await request.json();

    const properties = {
      ...defaultProperties,
      propertyManagementEnabled: Boolean(body.propertyManagementEnabled),
      allowNewListings: Boolean(body.allowNewListings),
      requireImages: Boolean(body.requireImages),
      minimumImages: Number(body.minimumImages),
      defaultStatus: body.defaultStatus,
      defaultCurrency: body.defaultCurrency,
      defaultPropertyType: body.defaultPropertyType,
      allowEditing: Boolean(body.allowEditing),
      allowDeletion: Boolean(body.allowDeletion),
      requireDescription: Boolean(body.requireDescription),
      requireLocation: Boolean(body.requireLocation),
      recommendationsEnabled: Boolean(body.recommendationsEnabled),
      virtualToursEnabled: Boolean(body.virtualToursEnabled),
      favoritesEnabled: Boolean(body.favoritesEnabled),
    };

    if (
      !Number.isInteger(properties.minimumImages) ||
      properties.minimumImages < 1 ||
      properties.minimumImages > 10
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Minimum images must be between 1 and 10",
        },
        {
          status: 400,
        },
      );
    }

    const validStatuses = ["available", "pending", "sold", "rented"];

    if (!validStatuses.includes(properties.defaultStatus)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid default property status",
        },
        {
          status: 400,
        },
      );
    }

    if (!["ETB", "USD"].includes(properties.defaultCurrency)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid default currency",
        },
        {
          status: 400,
        },
      );
    }

    const validPropertyTypes = [
      "house",
      "apartment",
      "villa",
      "land",
      "commercial",
      "other",
    ];

    if (!validPropertyTypes.includes(properties.defaultPropertyType)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid default property type",
        },
        {
          status: 400,
        },
      );
    }

    await dbConnect();

    const existingSettings = await SystemConfiguration.findOne();

    if (existingSettings) {
      existingSettings.properties = properties;

      await existingSettings.save();

      const savedProperties = normalizeProperties(existingSettings.properties);

      return NextResponse.json({
        success: true,
        message: "Property settings saved successfully",
        data: savedProperties,
      });
    }

    const settings = await SystemConfiguration.create({
      properties,
    });

    const savedProperties = normalizeProperties(settings.properties);

    return NextResponse.json({
      success: true,
      message: "Property settings saved successfully",
      data: savedProperties,
    });
  } catch (error) {
    console.error("Failed to save property settings:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to save property settings",
      },
      {
        status: 500,
      },
    );
  }
}

import XLSX from "xlsx";
import mongoose from "mongoose";

import Property from "../models/Property.js";

const EXCEL_FILE = "./src/scripts/properties.xlsx";

// Replace this with the MongoDB _id of the manager/agent
const CREATED_BY_ID = "6a5f1f0b6be0ba66e13d7da6";

async function importProperties() {
  try {
    console.log("Connecting to MongoDB...");

    await mongoose.connect(process.env.MONGODB_URI);

    console.log("MongoDB connected.");

    const workbook = XLSX.readFile(EXCEL_FILE);

    const sheetName = workbook.SheetNames[0];

    const worksheet = workbook.Sheets[sheetName];

    const rows = XLSX.utils.sheet_to_json(worksheet, {
      defval: "",
    });

    console.log(`Found ${rows.length} rows in Excel.`);

    if (rows.length === 0) {
      throw new Error("Excel file contains no property records.");
    }

    const properties = rows.map((row, index) => {
      const property = {
        title: String(row.title || "").trim(),

        description: String(row.description || "").trim(),

        propertyType: String(row.propertyType || "")
          .trim()
          .toLowerCase(),

        status: String(row.status || "available")
          .trim()
          .toLowerCase(),

        price: Number(row.price || 0),

        currency: String(row.currency || "ETB")
          .trim()
          .toUpperCase(),

        paymentType: String(row.paymentType || "full_payment")
          .trim()
          .toLowerCase(),

        location: {
          city: String(row.city || "Addis Ababa").trim(),

          subCity: String(row.subCity || "").trim(),

          address: String(row.address || "").trim(),

          latitude: row.latitude !== "" ? Number(row.latitude) : null,

          longitude: row.longitude !== "" ? Number(row.longitude) : null,
        },

        bedrooms: Number(row.bedrooms || 0),

        bathrooms: Number(row.bathrooms || 0),

        floorNumber: Number(row.floorNumber || 0),

        totalFloors: Number(row.totalFloors || 0),

        area: Number(row.area || 0),

        parkingSpace:
          row.parkingSpace === true ||
          String(row.parkingSpace).trim().toLowerCase() === "true",

        images: [],

        virtualTour: String(row.virtualTour || "").trim(),

        ownerPhone: String(row.ownerPhone || "").trim(),

        createdBy: CREATED_BY_ID,
      };

      if (!property.title) {
        throw new Error(`Row ${index + 2}: title is missing.`);
      }

      if (!property.description) {
        throw new Error(`Row ${index + 2}: description is missing.`);
      }

      if (!property.propertyType) {
        throw new Error(`Row ${index + 2}: propertyType is missing.`);
      }

      if (!property.price || property.price <= 0) {
        throw new Error(`Row ${index + 2}: invalid price.`);
      }

      return property;
    });

    console.log("\nProperties prepared:");

    properties.forEach((property, index) => {
      console.log(
        `${index + 1}. ${property.title} | ${property.location.subCity} | ${property.price} ${property.currency}`,
      );
    });

    console.log("\nImporting properties...");

    const insertedProperties = await Property.insertMany(properties);

    console.log(
      `\nSuccessfully imported ${insertedProperties.length} properties.`,
    );
  } catch (error) {
    console.error("\n❌ Import failed:");
    console.error(error.message);
  } finally {
    await mongoose.disconnect();

    console.log("MongoDB connection closed.");
  }
}

importProperties();

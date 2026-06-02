import { verifySession } from "@/lib/auth-server";
import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";

const VALID_CATEGORIES = ["camera", "recorder", "accessory", "cable", "network", "power_device", "storage"];
const VALID_TECHNOLOGIES = ["HD", "IP", "Common", "WiFi", "4G", "Solar"];
const BOOLEAN_VALUES = ["TRUE", "FALSE"];

export async function GET(req: NextRequest) {
  const session = await verifySession();
  if (!session.isAuthenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "TEAM CCTV Admin";
    workbook.created = new Date();

    const sheet = workbook.addWorksheet("Product Template");

    // Define columns
    sheet.columns = [
      { header: "id", key: "id", width: 25 },
      { header: "technical_name", key: "technical_name", width: 30 },
      { header: "display_name", key: "display_name", width: 40 },
      { header: "category", key: "category", width: 20 },
      { header: "technology", key: "technology", width: 15 },
      { header: "brand", key: "brand", width: 15 },
      { header: "base_cost", key: "base_cost", width: 15 },
      { header: "margin_percentage", key: "margin_percentage", width: 20 },
      { header: "unit_price", key: "unit_price", width: 15 },
      { header: "resolution_mp", key: "resolution_mp", width: 15 },
      { header: "channels", key: "channels", width: 12 },
      { header: "max_cameras", key: "max_cameras", width: 15 },
      { header: "is_active", key: "is_active", width: 12 },
    ];

    // Style the header row
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF3B82F6" }, // Blue-500
    };
    headerRow.alignment = { vertical: "middle", horizontal: "center" };

    // Apply data validation (dropdowns) to 1000 rows
    for (let i = 2; i <= 1000; i++) {
      // Category Dropdown (Column D)
      sheet.getCell(`D${i}`).dataValidation = {
        type: "list",
        allowBlank: true,
        formulae: [`"${VALID_CATEGORIES.join(",")}"`],
        showErrorMessage: true,
        errorTitle: "Invalid Category",
        error: `Please select from the dropdown.`,
      };

      // Technology Dropdown (Column E)
      sheet.getCell(`E${i}`).dataValidation = {
        type: "list",
        allowBlank: true,
        formulae: [`"${VALID_TECHNOLOGIES.join(",")}"`],
        showErrorMessage: true,
        errorTitle: "Invalid Technology",
        error: "Please select from the dropdown.",
      };

      // is_active Dropdown (Column M)
      sheet.getCell(`M${i}`).dataValidation = {
        type: "list",
        allowBlank: true,
        formulae: [`"${BOOLEAN_VALUES.join(",")}"`],
        showErrorMessage: true,
        errorTitle: "Invalid Value",
        error: "Must be TRUE or FALSE.",
      };
    }

    // Add an example row
    sheet.addRow({
      id: "",
      technical_name: "CAM-EX-123",
      display_name: "Example 2MP Camera",
      category: "camera",
      technology: "HD",
      brand: "Hikvision",
      base_cost: 1500,
      margin_percentage: 15,
      unit_price: "",
      resolution_mp: 2,
      channels: "",
      max_cameras: "",
      is_active: "TRUE",
    });

    const buffer = await workbook.xlsx.writeBuffer();

    const dateTag = new Date().toISOString().slice(0, 10);
    const filename = `product_template_${dateTag}.xlsx`;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Export template failed:", error);
    return NextResponse.json({ success: false, error: "Failed to generate template" }, { status: 500 });
  }
}

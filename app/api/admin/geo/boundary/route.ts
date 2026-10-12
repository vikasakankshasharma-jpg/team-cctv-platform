import { NextRequest, NextResponse } from "next/server";
import * as fs from "fs";
import * as path from "path";

/**
 * API endpoint to serve official government PIN code boundary polygons.
 * 
 * GET /api/admin/geo/boundary?pincode=302041
 * 
 * Returns the official data.gov.in boundary polygon coordinates for any Indian PIN code.
 * Falls back to pre-extracted individual GeoJSON files in public/geo/.
 * 
 * Source: Bharatlas / data.gov.in "All India Pincode Boundary GeoJSON" (19,312 polygons)
 * License: GODL-India (Government Open Data License)
 */

// In-memory cache of extracted boundaries (populated on first request)
let boundaryCache: Map<string, { coordinates: number[][][]; properties: any }> | null = null;

const GEOJSON_URL = "https://pub-0429b8e3b5a946e69ea007df844a6f1c.r2.dev/postal/boundaries/Datagov_Pincode_Boundaries.geojson";

export async function GET(request: NextRequest) {
  const pincode = request.nextUrl.searchParams.get("pincode")?.trim();
  
  if (!pincode || !/^\d{6}$/.test(pincode)) {
    return NextResponse.json(
      { error: "Valid 6-digit pincode required" },
      { status: 400 }
    );
  }

  // 1. Check for pre-extracted individual GeoJSON file
  const geoDir = path.join(process.cwd(), "public", "geo");
  const filePath = path.join(geoDir, `${pincode}.geojson`);
  
  if (fs.existsSync(filePath)) {
    try {
      const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      const coords = data.geometry?.coordinates;
      if (coords) {
        // Convert GeoJSON [lng, lat] to our {lat, lng} format
        const ring = data.geometry.type === "MultiPolygon" ? coords[0][0] : coords[0];
        const polygon = ring.map((p: number[]) => ({ lat: p[1], lng: p[0] }));
        return NextResponse.json({
          pincode,
          source: "data.gov.in",
          vertexCount: polygon.length,
          polygon,
          properties: data.properties,
        });
      }
    } catch (err) {
      console.error("Error reading cached GeoJSON:", err);
    }
  }

  // 2. If we have the full dataset in memory cache, use it
  if (boundaryCache?.has(pincode)) {
    const cached = boundaryCache.get(pincode)!;
    const polygon = cached.coordinates[0].map((p) => ({ lat: p[1], lng: p[0] }));
    return NextResponse.json({
      pincode,
      source: "data.gov.in",
      vertexCount: polygon.length,
      polygon,
      properties: cached.properties,
    });
  }

  // 3. Fetch from remote and extract the specific pincode
  try {
    console.log(`[Boundary API] Fetching remote GeoJSON to extract ${pincode}...`);
    const res = await fetch(GEOJSON_URL, { 
      next: { revalidate: 86400 } // Cache for 24 hours
    });
    
    if (!res.ok) {
      return NextResponse.json(
        { error: `Failed to fetch boundary data (${res.status})` },
        { status: 502 }
      );
    }
    
    const geojson = await res.json();
    
    // Build cache for all pincodes
    boundaryCache = new Map();
    for (const feature of geojson.features) {
      const pin = String(feature.properties?.Pincode);
      const coords = feature.geometry?.type === "MultiPolygon"
        ? feature.geometry.coordinates[0]
        : feature.geometry?.coordinates;
      if (pin && coords) {
        boundaryCache.set(pin, { coordinates: coords, properties: feature.properties });
      }
    }

    // Extract requested pincode
    if (boundaryCache.has(pincode)) {
      const cached = boundaryCache.get(pincode)!;
      const polygon = cached.coordinates[0].map((p: number[]) => ({ lat: p[1], lng: p[0] }));
      
      // Also save to disk for instant subsequent access
      try {
        fs.mkdirSync(geoDir, { recursive: true });
        const feature = geojson.features.find((f: any) => String(f.properties?.Pincode) === pincode);
        if (feature) {
          fs.writeFileSync(filePath, JSON.stringify(feature, null, 2));
        }
      } catch (_) {}

      return NextResponse.json({
        pincode,
        source: "data.gov.in",
        vertexCount: polygon.length,
        polygon,
        properties: cached.properties,
      });
    }

    return NextResponse.json(
      { error: `Pincode ${pincode} not found in boundary dataset` },
      { status: 404 }
    );
  } catch (err: any) {
    console.error("[Boundary API] Error:", err);
    return NextResponse.json(
      { error: "Failed to fetch boundary data" },
      { status: 502 }
    );
  }
}

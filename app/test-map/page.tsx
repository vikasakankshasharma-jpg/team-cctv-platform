"use client";
import MapplsBoundaryMap from "@/components/MapplsBoundaryMap";

export default function TestMap() {
  return (
    <div className="p-10 bg-white">
      <MapplsBoundaryMap boundaryType="district" boundaryQuery="JAIPUR" />
    </div>
  );
}

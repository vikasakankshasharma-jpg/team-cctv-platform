"use client";
import MapplsBoundaryMap from "@/components/MapplsBoundaryMap";

export default function TestMap() {
  return (
    <div className="p-10 bg-white">
      <MapplsBoundaryMap boundaryType="multi_pincode" boundaryQuery="305001" height="400px" />
    </div>
  );
}

import { useJsApiLoader } from "@react-google-maps/api";
import React from "react";

export function Test() {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script-1',
    googleMapsApiKey: "dummy",
  });
  
  const { isLoaded: isLoaded2 } = useJsApiLoader({
    id: 'google-map-script-2',
    googleMapsApiKey: "dummy",
  });
  
  return <div>{isLoaded ? "loaded" : "loading"}</div>;
}

import re

path = r'c:\Users\hp\Documents\TEAM Website\secure-easy\components\wizard\WizardClientV2.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update useEffect logic
old_use_effect = r"""            if (data.lat && data.lng) {
              setMapCenter({ lat: data.lat, lng: data.lng });
            }"""
new_use_effect = r"""            if (data.lat && data.lng) {
              setMapCenter({ lat: data.lat, lng: data.lng });
              setReq(prev => ({ ...prev, lat: prev.lat || data.lat, lng: prev.lng || data.lng }));
            }"""
content = content.replace(old_use_effect, new_use_effect)

# 2. Update onChange pincode logic
old_on_change = r"""                            if (data.lat && data.lng) {
                              setMapCenter({ lat: data.lat, lng: data.lng });
                            }"""
new_on_change = r"""                            if (data.lat && data.lng) {
                              setMapCenter({ lat: data.lat, lng: data.lng });
                              setReq(prev => ({ ...prev, lat: data.lat, lng: data.lng }));
                            }"""
content = content.replace(old_on_change, new_on_change)

# 3. Update GoogleMap options
old_map = r"""options={{ disableDefaultUI: true, zoomControl: true, streetViewControl: false }}"""
new_map = r"""options={{ disableDefaultUI: true, zoomControl: true, streetViewControl: false, fullscreenControl: true }}"""
content = content.replace(old_map, new_map)

# 4. Update Marker to make it draggable
old_marker = r"""                            <Marker
                              position={{ lat: req.lat, lng: req.lng }}"""
new_marker = r"""                            <Marker
                              draggable={true}
                              onDragEnd={(e) => {
                                if (e.latLng) {
                                  const lat = e.latLng.lat();
                                  const lng = e.latLng.lng();
                                  setReq(prev => ({ ...prev, lat, lng }));
                                  if (typeof google !== 'undefined' && google.maps) {
                                    const geocoder = new google.maps.Geocoder();
                                    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
                                      if (status === 'OK' && results && results[0]) {
                                        setReq(prev => ({ ...prev, customer_address: results[0].formatted_address }));
                                      }
                                    });
                                  }
                                }
                              }}
                              position={{ lat: req.lat, lng: req.lng }}"""
content = content.replace(old_marker, new_marker)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Done")

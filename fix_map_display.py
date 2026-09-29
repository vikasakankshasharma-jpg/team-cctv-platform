import re

path = r'c:\Users\hp\Documents\TEAM Website\secure-easy\components\wizard\WizardClientV2.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Problem 1: Marker only shows when req.lat && req.lng — but we need to ALWAYS 
# set req.lat/lng from mapCenter on load so the pin shows immediately.
# Fix: Change the marker condition to also show when mapCenter is set (i.e always on step 5)
# We use a derived pinLat/pinLng that falls back to mapCenter

# Problem 2: Map height is too small (h-48 = 192px). Make it bigger and add fullscreen
old_map_container = r'<div className="h-48 w-full rounded-xl border overflow-hidden relative shadow-inner bg-gray-50">'
new_map_container = r'<div className="h-64 sm:h-72 w-full rounded-xl border overflow-hidden relative shadow-inner bg-gray-50">'
content = content.replace(old_map_container, new_map_container)

# Problem 3: Marker only shows if req.lat && req.lng. On page load req.lat is undefined.
# Even though we call setReq with lat/lng, it's async. 
# Fix: Show marker based on mapCenter too (always show a pin)
old_marker_condition = r'{req.lat && req.lng && ('
new_marker_condition = r'{(req.lat || mapCenter.lat) && (req.lng || mapCenter.lng) && ('
content = content.replace(old_marker_condition, new_marker_condition)

# Fix the position to use req.lat/lng if available, else mapCenter
old_position = r'position={{ lat: req.lat, lng: req.lng }}'
new_position = r'position={{ lat: req.lat || mapCenter.lat, lng: req.lng || mapCenter.lng }}'
content = content.replace(old_position, new_position)

# Problem 4: GoogleMap center uses req.lat which may not be set yet on initial load
# The center should always follow mapCenter (which IS set from pincode API)
old_center = r'center={req.lat && req.lng ? { lat: req.lat, lng: req.lng } : mapCenter}'
new_center = r'center={mapCenter}'
content = content.replace(old_center, new_center)

# Problem 5: Also update zoom to be based on whether we have a real pin or just mapCenter
old_zoom = r'zoom={req.lat && req.lng ? 16 : 11}'
new_zoom = r'zoom={req.lat && req.lng ? 16 : 13}'
content = content.replace(old_zoom, new_zoom)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Done - verifying key changes:")
# Verify
with open(path, 'r', encoding='utf-8') as f:
    lines = f.readlines()
for i, line in enumerate(lines):
    if 'mapCenter.lat' in line or 'h-64' in line or 'zoom=' in line:
        print(f'{i+1}: {line.rstrip()}')

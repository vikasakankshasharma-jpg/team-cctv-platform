import os

path = r'c:\Users\hp\Documents\TEAM Website\secure-easy\components\wizard\WizardClientV2.tsx'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

# Replace the ugly window hack with a clean top-level constant
# First, remove the current libraries line
text = text.replace('libraries: typeof window !== "undefined" ? ((window.__google_maps_libraries__) || (window.__google_maps_libraries__ = ["places"])) : ["places"]', 'libraries: GOOGLE_MAPS_LIBRARIES')

# Add the constant at the top
if 'const GOOGLE_MAPS_LIBRARIES' not in text:
    text = text.replace('export function WizardClientV2() {', 'const GOOGLE_MAPS_LIBRARIES: any = ["places"];\n\nexport function WizardClientV2() {')

with open(path, 'w', encoding='utf-8') as f:
    f.write(text)

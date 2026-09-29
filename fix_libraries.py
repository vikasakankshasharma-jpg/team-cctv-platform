import os

path = r'c:\Users\hp\Documents\TEAM Website\secure-easy\components\wizard\WizardClientV2.tsx'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace('libraries: ["places"]', 'libraries: typeof window !== "undefined" ? ((window.__google_maps_libraries__) || (window.__google_maps_libraries__ = ["places"])) : ["places"]')

with open(path, 'w', encoding='utf-8') as f:
    f.write(text)

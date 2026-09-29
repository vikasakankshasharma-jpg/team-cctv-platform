import os

path = r'c:\Users\hp\Documents\TEAM Website\secure-easy\components\wizard\WizardClientV2.tsx'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

# Fix 1: Geocoder
text = text.replace("typeof google !== 'undefined'", "typeof google !== 'undefined' && google.maps")

with open(path, 'w', encoding='utf-8') as f:
    f.write(text)

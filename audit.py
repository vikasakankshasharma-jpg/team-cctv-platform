import os, re, json
from collections import defaultdict

def audit(base_path):
    report = defaultdict(list)
    
    for root, dirs, files in os.walk(base_path):
        if 'node_modules' in root or '.next' in root: continue
        for file in files:
            if not file.endswith('.tsx'): continue
            if 'app\\(installer)' not in root and 'app\\delivery' not in root and 'app\\(customer)' not in root and 'components\\installer' not in root and 'components\\delivery' not in root and 'components\\customer' not in root and 'components\\shared' not in root:
                continue
                
            path = os.path.join(root, file)
            rel_path = os.path.relpath(path, base_path)
            
            try:
                content = open(path, 'r', encoding='utf-8', errors='ignore').read()
            except:
                continue
            
            issues = []
            
            if 'table' in content.lower() and '<table' in content:
                issues.append("Medium: Uses legacy table. Mobile-first field apps should prefer Card-based layouts.")
            if 'min-h-[44px]' not in content and '<button' in content.lower():
                issues.append("Low: Potential touch-target size issue for mobile (no min-h-[44px] on buttons).")
            if 'href=' not in content and 'router.push' not in content and ('page.tsx' in file):
                issues.append("Medium: Page might be a dead end (no navigation links).")
            if 'await Promise.all' not in content and content.count('await ') > 2:
                issues.append("Medium: Multiple sequential awaits detected; consider Promise.all for parallelized queries.")
            if '<img ' in content and 'next/image' not in content:
                issues.append("Medium: Uses native <img> instead of next/image for optimization.")
            if 'isOffline' not in content and 'navigator.onLine' not in content and 'fetch(' in content:
                issues.append("High: Network fetch without offline fallback/indicator or retry logic.")
            if ',1' in content or ',1' in content:
                if ',1' in content:
                    issues.append("High: Broken currency symbol encoding (,1).")
            if 'localStorage' in content and ('pin' in content.lower() or 'otp' in content.lower()):
                issues.append("Critical: Potential OTP/PIN exposure in localStorage.")
            if '<img' in content and 'alt=' not in content:
                issues.append("Low: Image missing alt attribute (Accessibility).")
            if '@ts-ignore' in content:
                issues.append("Low: Uses @ts-ignore (Code Quality).")
            if 'console.log' in content:
                issues.append("Low: Leftover console.log statement.")

            if issues:
                report[rel_path] = issues
                
    return report

if __name__ == '__main__':
    rep = audit(r'c:\\Users\\hp\\Documents\\TEAM Website\\secure-easy')
    for k, v in rep.items():
        print(f"FILE: {k}")
        for i in v:
            print(f"  - {i}")

from bs4 import BeautifulSoup
import sys

sys.stdout.reconfigure(encoding='utf-8')

path = r'C:\Users\hp\Downloads\Megacompuworld\IP Camera 4MP_ Mega Compu World.html'
soup = BeautifulSoup(open(path, encoding='utf-8', errors='ignore').read(), 'html.parser')

print("All 4MP IP Camera products in this file:")
for c in soup.select('.pcard'):
    txt = c.get_text(separator=' | ', strip=True)
    a = c.select_one('a.pcard-img')
    title = a.get('aria-label', '') if a else ''
    pid = ''
    if 'PID:' in txt:
        pid = txt.split('PID:')[1].split('|')[0].strip()
    price = ''
    if '₹' in txt:
        price = txt.split('₹')[1].split('|')[0].strip()
    
    # Check if project brand is in image url or text
    img = c.select_one('img[data-nimg]')
    src = img.get('srcset', '') if img else ''
    is_project = 'project' in src.lower() or 'project' in txt.lower()
    
    print(f"PID: {pid:<6} | ₹{price:<6} | Project: {str(is_project):<5} | {title}")

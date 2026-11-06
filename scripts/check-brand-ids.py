from bs4 import BeautifulSoup
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

path = r'C:\Users\hp\Downloads\Megacompuworld\IP Camera 4MP_ Mega Compu World.html'
soup = BeautifulSoup(open(path, encoding='utf-8', errors='ignore').read(), 'html.parser')

# Find brand filter section
brand_labels = soup.find_all(string=re.compile(r'PRAMA', re.IGNORECASE))
print("Found PRAMA mentions:")
for bl in brand_labels:
    p = bl.parent
    print(p.name, p.get('class'), bl.strip())
    # look around for input or checkbox or value
    container = p.find_parent('label') or p.find_parent('div')
    if container:
        inp = container.find('input')
        if inp:
            print("  Input:", inp.get('name'), inp.get('value'), inp.get('id'))

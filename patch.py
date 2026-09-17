import re
path = 'app/api/admin/payments/verify/route.ts'
with open(path, 'r', encoding='utf-8') as f:
    c = f.read()
c = c.replace('resolved_by: session.userId,', 'resolved_by: session.user?.uid,')
with open(path, 'w', encoding='utf-8') as f:
    f.write(c)

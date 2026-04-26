import re

with open('src/app/hasil-produksi/HasilProduksiClient.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

div_open = len(re.findall(r'<div', text))
div_close = len(re.findall(r'</div', text))
brace_open = text.count('{')
brace_close = text.count('}')
paren_open = text.count('(')
paren_close = text.count(')')

print(f"DIV: {div_open} / {div_close}")
print(f"BRACE: {brace_open} / {brace_close}")
print(f"PAREN: {paren_open} / {paren_close}")

# Find imbalance line by line
depth_div = 0
depth_brace = 0
depth_paren = 0
for i, line in enumerate(text.splitlines(), 1):
    depth_div += len(re.findall(r'<div', line)) - len(re.findall(r'</div', line))
    depth_brace += line.count('{') - line.count('}')
    depth_paren += line.count('(') - line.count(')')
    if depth_div < 0 or depth_brace < 0 or depth_paren < 0:
        print(f"Imbalance at line {i}: DIV={depth_div} BRACE={depth_brace} PAREN={depth_paren}")
        break

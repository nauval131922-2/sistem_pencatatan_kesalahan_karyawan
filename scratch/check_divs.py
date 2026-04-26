import re

with open('src/app/hasil-produksi/HasilProduksiClient.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Track div depth
depth = 0
for i, line in enumerate(text.splitlines(), 1):
    opens = len(re.findall(r'<div', line))
    closes = len(re.findall(r'</div', line))
    if opens != closes:
        depth += opens - closes
        print(f"Line {i:3}: {line.strip()[:50]:50} | Depth: {depth}")

print(f"Final Depth: {depth}")

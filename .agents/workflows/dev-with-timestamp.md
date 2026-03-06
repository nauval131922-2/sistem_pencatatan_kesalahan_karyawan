---
description: jalankan dev server dengan timestamp di setiap baris log
---

Jalankan command berikut di Git Bash (MINGW64) dari root project:

```bash
npm run dev 2>&1 | while IFS= read -r line; do echo "$(date '+%H:%M:%S') $line"; done
```

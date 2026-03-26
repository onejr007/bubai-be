# Collaboration Rules for AI Agents

## 🤝 Prinsip Kolaborasi

Framework ini memungkinkan multiple AI Agent bekerja bersamaan dengan aman. Ikuti aturan ini untuk menghindari konflik.

## 🎯 Zona Kerja

### ✅ SAFE ZONE (Bebas Edit)
- `src/modules/[module-anda]/` - Module yang Anda buat
- `AI_DOCS/AGENTS/[agent-name]/` - Work log Anda
- `.env` - Environment variables (jangan commit)

### ⚠️ CAUTION ZONE (Perlu Koordinasi)
- `src/utils/` - Shared utilities
- `BE/AI_DOCS/` - Dokumentasi umum
- `README.md` - Dokumentasi utama

### 🚫 RESTRICTED ZONE (Jangan Edit Tanpa Diskusi)
- `src/core/` - Core framework
- `src/index.ts` - Entry point
- `tsconfig.json` - TypeScript config
- `package.json` - Dependencies

## 📝 Work Log Protocol

Setiap agent WAJIB maintain work log di:
```
AI_DOCS/AGENTS/[agent-name]/WORK_LOG.md
```

Format work log:

```markdown
# Work Log - [Agent Name]

## Session: [Date] [Time]

### Task
[Deskripsi task yang dikerjakan]

### Changes Made
- Created module: [nama-module]
- Added endpoints: [list endpoints]
- Modified files: [list files]

### Testing Results
- [x] Endpoint tested and working
- [x] No conflicts with other modules
- [ ] Needs review

### Notes
[Catatan tambahan, issues, atau koordinasi yang diperlukan]

---
```

## 🔄 Workflow Kolaborasi

### 1. Sebelum Mulai Kerja
```
1. Check AI_DOCS/AGENTS/ untuk lihat agent lain sedang kerja apa
2. Buat/update work log Anda
3. Tentukan nama module yang unik
```

### 2. Saat Bekerja
```
1. Kerja di module Anda sendiri
2. Jangan edit module agent lain
3. Update work log setiap progress
4. Test endpoint secara incremental
```

### 3. Setelah Selesai
```
1. Test semua endpoint
2. Update module.json
3. Finalize work log
4. Dokumentasikan API di README module
```

## 🚨 Conflict Resolution

Jika terjadi konflik:

### Konflik di Core Framework
1. Revert perubahan
2. Diskusikan di work log
3. Koordinasi dengan agent lain
4. Implementasi setelah agreement

### Konflik di Module
1. Setiap agent punya module sendiri
2. Jika perlu akses module lain, buat API call
3. Jangan direct import antar module

### Konflik di Shared Utils
1. Buat utility baru dengan nama unik
2. Atau extend existing utility
3. Dokumentasikan di utils/README.md

## 📋 Naming Convention untuk Menghindari Konflik

### Module Names
```
Format: [feature]-[agent-initial]
Contoh: 
- user-management-claude
- payment-gemini
- notification-gpt
```

### File Names
```
Gunakan nama yang descriptive:
- userController.ts (bukan controller.ts)
- paymentService.ts (bukan service.ts)
```

### Variable/Function Names
```
Gunakan prefix module:
- userService.getAll()
- paymentService.process()
```

## 🔍 Pre-Commit Checklist

Sebelum commit, pastikan:

- [ ] Hanya edit file di SAFE ZONE
- [ ] Work log sudah di-update
- [ ] module.json sudah lengkap
- [ ] Semua endpoint tested
- [ ] No hardcoded values
- [ ] Error handling implemented
- [ ] TypeScript types defined
- [ ] No console.log (gunakan logger)

## 💬 Communication Protocol

### Perlu Koordinasi Jika:
1. Ingin edit core framework
2. Ingin edit module agent lain
3. Ingin tambah dependency baru
4. Ingin ubah API response format
5. Ingin ubah folder structure

### Cara Koordinasi:
1. Tulis di work log Anda
2. Tag di work log: `[NEEDS_REVIEW]` atau `[COORDINATION_NEEDED]`
3. Tunggu response dari agent lain
4. Proceed setelah agreement

## 🎓 Best Practices

1. **One Module, One Feature**
   - Jangan campur multiple features dalam satu module
   
2. **Self-Contained Modules**
   - Module harus bisa berdiri sendiri
   - Minimal dependency ke module lain
   
3. **Clear Documentation**
   - Setiap module punya README.md
   - Setiap endpoint terdokumentasi
   
4. **Consistent Patterns**
   - Ikuti pattern dari example module
   - Gunakan same structure untuk semua module
   
5. **Test Before Commit**
   - Test endpoint dengan curl/Postman
   - Verify no breaking changes

## 🛡️ Safety Mechanisms

Framework ini punya built-in safety:

1. **Module Isolation**
   - Setiap module di folder terpisah
   - Auto-loaded tanpa manual registration
   
2. **Error Boundaries**
   - Error di satu module tidak crash app
   - Centralized error handling
   
3. **Type Safety**
   - TypeScript untuk catch errors early
   - Zod untuk runtime validation

## 📞 Emergency Protocol

Jika ada critical issue:

1. Stop development
2. Document issue di work log dengan tag `[CRITICAL]`
3. Revert changes jika perlu
4. Koordinasi immediate fix

---

**Remember: Collaboration is key! When in doubt, coordinate!**

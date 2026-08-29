# Project: mesob-adama (eService System)

## Architecture
- Backend: Laravel (API-based, Sanctum auth, RBAC with permissions)
- Frontend: Next.js (App Router, TypeScript, React Query, shadcn UI)

---

## Global Rules (VERY IMPORTANT)

- Do NOT break existing modules
- Do NOT rename or remove existing endpoints, files, or structures
- Follow existing coding style and patterns in the repository
- Keep code modular, clean, and production-ready
- Ensure backend and frontend remain fully compatible

---

# 🔹 Backend Rules (Laravel API)

## API & Structure
- Use existing route structure (do NOT change routes unless necessary)
- Follow RESTful conventions
- Controllers → Services → Models pattern
- Use FormRequest for validation
- Use API Resources for responses

## Response Format (STRICT)
All APIs must return:

```json
{
  "success": true,
  "message": "Message here",
  "data": [],
  "meta": {
    "current_page": 1,
    "per_page": 10,
    "total": 100,
    "last_page": 10
  }
}

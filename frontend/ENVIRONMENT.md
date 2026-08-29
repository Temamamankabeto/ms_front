# Frontend environment

Use the backend root URL without `/api`:

```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
NEXT_PUBLIC_API_TIMEOUT=15000
```

The axios client appends `/api` internally.

/** Resolve Laravel public-storage images through the existing Next.js origin. */
export function resolveProfileImageUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  const input = value.trim();
  if (!input) return null;

  // Local previews are intentionally handled by the browser unchanged.
  if (input.startsWith("blob:")) return input;

  try {
    const parsed = new URL(input, "http://mesob.local");
    const path = parsed.pathname;
    if (path.startsWith("/storage/")) {
      return `${path}${parsed.search}`;
    }
    // Preserve unrelated external image URLs rather than rewriting them.
    if (/^https?:\/\//i.test(input)) return input;
  } catch {
    return null;
  }

  // Laravel's stored profile_image is a disk-relative path.
  const path = input.replace(/^\/+/, "");
  if (path.startsWith("users/profile-images/")) {
    return `/storage/${path}`;
  }
  return input.startsWith("/") ? input : null;
}

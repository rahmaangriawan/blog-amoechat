"use client";

export function LoginForm({ next, siteKey }: { next: string; siteKey?: string }) {
  return (
    <form action="/api/login" method="post" className="mt-6 grid gap-4">
      <input type="hidden" name="next" value={next} />
      
      <label className="grid gap-2 text-sm font-semibold">
        Email
        <input name="email" type="email" autoComplete="username" required />
      </label>
      
      <label className="grid gap-2 text-sm font-semibold">
        Password
        <input name="password" type="password" autoComplete="current-password" required />
      </label>

      <label className="inline-flex w-fit items-center gap-3 py-2 text-sm font-bold text-[var(--foreground)]">
        <input className="!h-4 !w-4 accent-[var(--primary)]" name="remember" type="checkbox" />
        <span>Ingat Saya</span>
      </label>

      {siteKey && (
        <div className="cf-turnstile" data-sitekey={siteKey}></div>
      )}

      <button className="button mt-2 w-full" type="submit">
        Masuk
      </button>
    </form>
  );
}

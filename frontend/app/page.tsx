export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6 rounded-xl border bg-card p-6">
        <div>
          <h1 className="text-2xl font-bold">HackCanada Platform</h1>
          <p className="text-sm text-muted-foreground">Choose how you want to access the platform.</p>
        </div>
        <div className="space-y-3">
          <a href="/submit" className="block rounded-md border px-4 py-3 text-sm hover:bg-muted/40">
            Submit Project (Hackers)
          </a>
          <a href="/judge-login" className="block rounded-md border px-4 py-3 text-sm hover:bg-muted/40">
            Judge/Sponsor Login
          </a>
          <a href="/login" className="block rounded-md border px-4 py-3 text-sm hover:bg-muted/40">
            Admin Login
          </a>
        </div>
      </div>
    </div>
  )
}

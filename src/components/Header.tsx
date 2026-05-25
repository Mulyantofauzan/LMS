import Link from 'next/link';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex gap-6 md:gap-10">
          <Link href="/" className="flex items-center space-x-2">
            <div className="h-8 w-8 overflow-hidden rounded-md border border-border bg-white shadow-sm">
              <img src="/brand/pst-logo.png" alt="PST" className="h-full w-full object-contain" />
            </div>
            <span className="inline-block font-bold text-lg tracking-tight">PST Learning Management System</span>
          </Link>
        </div>
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600 dark:text-gray-300">
          <a href="#features" className="hover:text-primary transition-colors">Features</a>
          <a href="#stats" className="hover:text-primary transition-colors">Why PST</a>
          <a href="#testimonials" className="hover:text-primary transition-colors">Testimonials</a>
        </nav>
        <div className="flex items-center gap-3">
          <Link 
            href="/login" 
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-5 py-2 shadow-sm"
            aria-label="Login to your account"
          >
            Sign In
          </Link>
        </div>
      </div>
    </header>
  );
}

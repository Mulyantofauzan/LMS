import Header from "@/components/Header";
import Link from "next/link";
import { db } from "@/db";
import { settings } from "@/db/schema";

export default async function Home() {
  let s: Record<string, string> = {};

  try {
    const allSettings = await db.select().from(settings);
    s = allSettings.reduce((acc, curr) => ({ ...acc, [curr.key]: curr.value }), {} as Record<string, string>);
  } catch {
    // Use defaults if DB not ready
  }

  const brandName = s['brandName'] || 'PST Learning Management System';
  const brandShort = s['brandShort'] || 'PST';
  const heroTitle = s['heroTitle'] || 'Empowering Industrial Workforce Through Smarter Training';
  const heroSubtitle = s['heroSubtitle'] || 'PST Learning Management System helps mining and industrial companies manage training compliance, certifications, and workforce development across every jobsite — all in one platform.';
  const heroBadge = s['heroBadge'] || 'Trusted by 50+ Industrial Companies';
  const ctaTitle = s['ctaTitle'] || 'Ready to Transform Your Training Compliance?';
  const ctaSubtitle = s['ctaSubtitle'] || 'Join 50+ industrial companies using PST Learning Management System to keep their workforce safe, certified, and compliant.';
  const footerDescription = s['footerDescription'] || 'Enterprise Learning Management System for industrial and mining companies. Manage training compliance across all your jobsites.';

  const features = [1,2,3,4,5,6].map((n) => {
    const defaults: Record<number, {icon: string, title: string, desc: string}> = {
      1: { icon: "🏗️", title: "Multi-Jobsite Management", desc: "Isolate data per jobsite. Super Admins oversee all sites while Site Admins manage their own operations independently." },
      2: { icon: "📋", title: "Training Compliance Matrix", desc: "Track mandatory and optional trainings per role. Get instant visibility into which employees are compliant or overdue." },
      3: { icon: "🎓", title: "Automated Certificates", desc: "Generate verifiable PDF certificates with QR codes instantly upon training completion. Track expiry and renewals." },
      4: { icon: "📊", title: "Real-time Analytics", desc: "Interactive dashboards with compliance charts, attendance trends, and training effectiveness metrics across all sites." },
      5: { icon: "✅", title: "Attendance & QR Check-in", desc: "Digital attendance tracking with manual or QR code-based check-in. Automatic late/absent flagging for compliance." },
      6: { icon: "🔐", title: "Role-Based Access Control", desc: "Five distinct roles — Super Admin, Site Admin, Manager, Trainer, and Trainee — each with precisely scoped permissions." },
    };
    const d = defaults[n];
    return {
      icon: s[`feature${n}Icon`] || d.icon,
      title: s[`feature${n}Title`] || d.title,
      desc: s[`feature${n}Desc`] || d.desc,
    };
  });

  const stats = [
    { value: s['stat1Value'] || '50+', label: s['stat1Label'] || 'Industrial Companies' },
    { value: s['stat2Value'] || '12K+', label: s['stat2Label'] || 'Active Trainees' },
    { value: s['stat3Value'] || '98.5%', label: s['stat3Label'] || 'Compliance Rate' },
    { value: s['stat4Value'] || '25K+', label: s['stat4Label'] || 'Certificates Issued' },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">

        {/* Hero Section */}
        <section className="relative w-full py-24 md:py-32 lg:py-44 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900"></div>
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 25% 50%, rgba(59, 130, 246, 0.3), transparent 50%), radial-gradient(circle at 75% 50%, rgba(14, 165, 233, 0.2), transparent 50%)' }}></div>
          <div className="container mx-auto px-4 md:px-6 relative z-10">
            <div className="flex flex-col items-center space-y-8 text-center max-w-4xl mx-auto">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-sm text-blue-300 backdrop-blur animate-fade-in-up">
                <span className="h-2 w-2 rounded-full bg-blue-400 animate-pulse"></span>
                {heroBadge}
              </div>
              <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl text-white animate-fade-in-up-delay-1 leading-[1.1]">
                {heroTitle}
              </h1>
              <p className="mx-auto max-w-[700px] text-lg md:text-xl text-slate-300 animate-fade-in-up-delay-2 leading-relaxed">
                {heroSubtitle}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-4 animate-fade-in-up-delay-3">
                <Link 
                  href="/login"
                  className="inline-flex h-12 items-center justify-center rounded-lg bg-primary px-8 text-sm font-semibold text-primary-foreground shadow-lg shadow-blue-500/25 transition-all hover:bg-primary/90 hover:shadow-blue-500/40 hover:scale-[1.02]"
                >
                  Get Started Free
                </Link>
                <a 
                  href="#features"
                  className="inline-flex h-12 items-center justify-center rounded-lg border border-slate-600 px-8 text-sm font-semibold text-slate-200 transition-all hover:bg-white/5 hover:border-slate-400"
                >
                  Explore Features
                </a>
              </div>
              <div className="flex items-center gap-8 pt-8 text-sm text-slate-400">
                <div className="flex items-center gap-2">
                  <svg className="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  No credit card required
                </div>
                <div className="flex items-center gap-2">
                  <svg className="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  Free demo access
                </div>
                <div className="flex items-center gap-2 hidden sm:flex">
                  <svg className="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  Cancel anytime
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="w-full py-20 md:py-28 bg-background">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">Features</p>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Everything You Need for Training Compliance</h2>
              <p className="mt-4 text-muted-foreground text-lg">From onboarding to certification — manage the entire lifecycle of industrial workforce training.</p>
            </div>
            <div className="grid max-w-6xl mx-auto gap-6 md:grid-cols-2 lg:grid-cols-3">
              {features.map((f, i) => (
                <div key={i} className="group flex flex-col p-6 border border-border rounded-xl bg-card shadow-sm card-hover">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
                    {f.icon}
                  </div>
                  <h3 className="text-lg font-bold mb-2">{f.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed flex-1">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section id="stats" className="w-full py-20 md:py-24 bg-gradient-to-r from-blue-950 to-slate-900 text-white">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <p className="text-sm font-semibold text-blue-300 uppercase tracking-wider mb-3">Why Choose {brandShort}</p>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Built for Scale. Designed for Safety.</h2>
            </div>
            <div className="grid max-w-5xl mx-auto gap-8 md:grid-cols-4 text-center">
              {stats.map((st, i) => (
                <div key={i} className="space-y-2">
                  <div className="text-4xl md:text-5xl font-extrabold gradient-text">{st.value}</div>
                  <div className="text-sm text-slate-400 font-medium">{st.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="w-full py-20 md:py-28 bg-background">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">How It Works</p>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Get Your Team Compliant in 4 Steps</h2>
            </div>
            <div className="grid max-w-5xl mx-auto gap-8 md:grid-cols-4">
              {[
                { step: "01", title: "Setup Jobsites", desc: "Create your company structure and define jobsite locations with their specific training requirements." },
                { step: "02", title: "Add Your Team", desc: "Import or create employee profiles. Assign roles as trainers, managers, or trainees across sites." },
                { step: "03", title: "Schedule Training", desc: "Create training sessions, attach question banks, set mandatory certifications, and enroll trainees." },
                { step: "04", title: "Track & Certify", desc: "Monitor attendance, evaluate results, and auto-generate verifiable certificates upon completion." },
              ].map((st, i) => (
                <div key={i} className="relative text-center group">
                  <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary font-extrabold text-lg mb-4 group-hover:bg-primary group-hover:text-white transition-all">
                    {st.step}
                  </div>
                  <h3 className="text-lg font-bold mb-2">{st.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{st.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section id="testimonials" className="w-full py-20 md:py-28 bg-card border-t border-border">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">Testimonials</p>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Trusted by Industry Leaders</h2>
            </div>
            <div className="grid max-w-5xl mx-auto gap-8 md:grid-cols-3">
              {[
                { quote: `${brandShort} LMS cut our certification tracking time by 80%. We went from spreadsheets to a fully automated compliance system in just two weeks.`, name: "Ahmad Rifai", role: "HSE Manager, PT Mining Corp", avatar: "AR" },
                { quote: "The multi-jobsite feature is a game changer. Each site runs independently but I have full visibility as corporate HSE Director.", name: "Sarah Wijaya", role: "HSE Director, Indo Resources", avatar: "SW" },
                { quote: "Our trainers love the digital attendance and instant certificate generation. The QR verification gives us credibility with auditors.", name: "Budi Santoso", role: "Training Coordinator, Bara Mining", avatar: "BS" },
              ].map((t, i) => (
                <div key={i} className="flex flex-col p-6 border border-border rounded-xl bg-background shadow-sm card-hover">
                  <div className="flex-1">
                    <div className="flex gap-1 mb-4">
                      {[1,2,3,4,5].map(star => <svg key={star} className="h-4 w-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>)}
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed italic">&ldquo;{t.quote}&rdquo;</p>
                  </div>
                  <div className="flex items-center gap-3 mt-6 pt-4 border-t border-border">
                    <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">{t.avatar}</div>
                    <div>
                      <p className="text-sm font-semibold">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="w-full py-20 md:py-28 bg-gradient-to-r from-primary to-accent text-white">
          <div className="container mx-auto px-4 md:px-6 text-center max-w-3xl">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">{ctaTitle}</h2>
            <p className="text-lg text-white/80 mb-8 max-w-xl mx-auto">{ctaSubtitle}</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/login"
                className="inline-flex h-12 items-center justify-center rounded-lg bg-white text-primary px-8 text-sm font-bold shadow-lg transition-all hover:bg-gray-100 hover:scale-[1.02]"
              >
                Start Free Trial
              </Link>
              <a 
                href="#features"
                className="inline-flex h-12 items-center justify-center rounded-lg border-2 border-white/40 px-8 text-sm font-semibold text-white transition-all hover:bg-white/10 hover:border-white/60"
              >
                Learn More
              </a>
            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="w-full border-t border-border bg-card py-12">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid gap-8 md:grid-cols-4">
            <div className="md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 bg-primary rounded-md flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-sm">{brandShort}</span>
                </div>
                <span className="font-bold text-lg tracking-tight">{brandShort} LMS</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {footerDescription}
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-4">Product</h4>
              <ul className="space-y-2.5 text-sm">
                <li><a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">Features</a></li>
                <li><a href="#stats" className="text-muted-foreground hover:text-foreground transition-colors">Why {brandShort}</a></li>
                <li><Link href="/login" className="text-muted-foreground hover:text-foreground transition-colors">Sign In</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-4">Resources</h4>
              <ul className="space-y-2.5 text-sm">
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Documentation</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">API Reference</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Support</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-4">Legal</h4>
              <ul className="space-y-2.5 text-sm">
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Terms of Service</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Security</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-10 pt-8 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">&copy; {new Date().getFullYear()} {brandName}. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="LinkedIn">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Twitter">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

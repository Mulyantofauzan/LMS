import Link from "next/link";
import LoginForm from "./login-form";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen">
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:flex-none lg:px-20 xl:px-24 bg-background">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div>
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 overflow-hidden rounded-md border border-border bg-white shadow-sm">
                <img src="/brand/pst-logo.png" alt="PST" className="h-full w-full object-contain" />
              </div>
              <span className="font-bold text-xl tracking-tight text-foreground">PST Learning Management System</span>
            </div>
            <h2 className="mt-8 text-2xl font-bold leading-9 tracking-tight text-foreground">
              Sign in to your account
            </h2>
            <p className="mt-2 text-sm leading-6 text-gray-500">
              Not a member? <span className="font-semibold text-primary hover:text-primary/80 cursor-pointer">Contact your Site Admin</span>
            </p>
          </div>
          <LoginForm />
        </div>
      </div>
      <div className="relative hidden w-0 flex-1 lg:block bg-slate-900">
        <div className="absolute inset-0 h-full w-full bg-gradient-to-br from-slate-800 to-slate-950 flex flex-col items-center justify-center text-center p-12">
          <div className="max-w-2xl">
            <h1 className="text-4xl lg:text-5xl font-bold text-white mb-6">Master Your Site Compliance</h1>
            <p className="text-xl text-slate-300 max-w-lg mx-auto">
              Streamlined training, certification, and attendance management for modern industrial operations.
            </p>
            <div className="mt-12 grid grid-cols-2 gap-8 text-left">
              <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700/50 backdrop-blur shadow-xl">
                <h3 className="text-white font-semibold text-lg mb-2">Multi-Jobsite Support</h3>
                <p className="text-slate-400 text-sm">Isolate and manage compliance across dozens of distinct operational sites securely.</p>
              </div>
              <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700/50 backdrop-blur shadow-xl">
                <h3 className="text-white font-semibold text-lg mb-2">Automated Certificates</h3>
                <p className="text-slate-400 text-sm">Generate verifiable PDF certificates with secure QR code verification instantly.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

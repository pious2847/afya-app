import Link from "next/link";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import {
  Stethoscope,
  Phone,
  MapPin,
  Heart,
  MessageCircle,
  Shield,
  AlertTriangle,
  ArrowRight,
  Zap,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Nav */}
      <header className="fixed top-0 z-50 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold text-emerald-700">AfyaAI</span>
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
              Health
            </span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/clinics" className="hidden text-sm font-medium text-slate-600 hover:text-emerald-600 sm:block">
              Find Clinics
            </Link>
            <SignedOut>
              <SignInButton mode="modal">
                <button className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                  Sign in
                </button>
              </SignInButton>
              <SignInButton mode="modal">
                <button className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700">
                  Get Started
                </button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <Link href="/dashboard" className="text-sm font-medium text-slate-600 hover:text-emerald-600">
                Dashboard
              </Link>
              <Link
                href="/teleconsult"
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
              >
                Call AI
              </Link>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>
          </nav>
        </div>
      </header>

      <main className="pt-16">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-white to-teal-50" />
          <div className="absolute top-20 right-0 h-96 w-96 rounded-full bg-emerald-200/30 blur-3xl" />
          <div className="absolute bottom-20 left-0 h-72 w-72 rounded-full bg-teal-200/30 blur-3xl" />
          <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8 lg:py-36">
            <div className="mx-auto max-w-3xl text-center">
              <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-800">
                <Zap className="h-4 w-4" />
                BEORCHID Africa Developers Hackathon 2026
              </p>
              <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
                AI-Powered Health Triage for{" "}
                <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  Rural Africa
                </span>
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600">
                Access intelligent symptom assessment, risk classification, and connection to nearby healthcare—designed for low-resource and low-connectivity communities.
              </p>
              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <SignedOut>
                  <SignInButton mode="modal">
                    <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-700 sm:w-auto">
                      Start Health Assessment
                      <ArrowRight className="h-5 w-5" />
                    </button>
                  </SignInButton>
                </SignedOut>
                <SignedIn>
                  <Link
                    href="/assessment"
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-700 sm:w-auto"
                  >
                    Start Health Assessment
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                </SignedIn>
                <Link
                  href="/clinics"
                  className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-slate-300 bg-white px-8 py-4 text-base font-semibold text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 sm:w-auto"
                >
                  <MapPin className="h-5 w-5" />
                  Find Nearby Clinics
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Problem */}
        <section className="border-t border-slate-200 bg-white py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold text-slate-900">
                Healthcare access remains a critical challenge
              </h2>
              <p className="mt-4 text-lg text-slate-600">
                Millions in rural African communities face delayed diagnoses, long travel distances, overcrowded hospitals, and limited access to medical professionals. AfyaAI exists to change that.
              </p>
            </div>
            <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <ProblemCard
                title="Delayed diagnoses"
                description="Early detection saves lives. AI triage helps identify risks sooner."
              />
              <ProblemCard
                title="Long travel distances"
                description="Find the nearest clinic and get directions before you travel."
              />
              <ProblemCard
                title="Limited medical access"
                description="Voice teleconsult and AI guidance when a doctor isn’t nearby."
              />
              <ProblemCard
                title="Overcrowded facilities"
                description="Smart risk classification helps route care more efficiently."
              />
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="border-t border-slate-200 bg-slate-50 py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-center text-3xl font-bold text-slate-900">
              How AfyaAI works
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-center text-slate-600">
              Three simple steps from symptoms to care.
            </p>
            <div className="mt-16 grid gap-8 md:grid-cols-3">
              <StepCard
                step={1}
                title="Describe your symptoms"
                description="Chat with the AI or use the body map. Natural, conversational—no complex forms."
                icon={<MessageCircle className="h-8 w-8" />}
              />
              <StepCard
                step={2}
                title="Get risk classification"
                description="Low, Medium, High, or Emergency—with clear recommendations and next steps."
                icon={<Shield className="h-8 w-8" />}
              />
              <StepCard
                step={3}
                title="Connect to care"
                description="Find nearby clinics, call the AI for voice guidance, or get emergency hospital contacts."
                icon={<Phone className="h-8 w-8" />}
              />
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="border-t border-slate-200 bg-white py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-center text-3xl font-bold text-slate-900">
              Built for rural healthcare
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-center text-slate-600">
              Every feature is designed for low-resource and low-connectivity environments.
            </p>
            <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              <FeatureCard
                icon={<MessageCircle className="h-7 w-7 text-emerald-600" />}
                title="Conversational AI Assessment"
                description="Chat-style symptom intake. The AI asks adaptive follow-up questions—no rigid forms."
              />
              <FeatureCard
                icon={<Stethoscope className="h-7 w-7 text-emerald-600" />}
                title="Symptom Body Map"
                description="Visual body region selector (head, chest, stomach, etc.) for more accurate triage."
              />
              <FeatureCard
                icon={<Phone className="h-7 w-7 text-emerald-600" />}
                title="Voice Teleconsult & Live AI Call"
                description="Talk to the AI like a real person. Hear recommendations aloud—no typing needed."
              />
              <FeatureCard
                icon={<MapPin className="h-7 w-7 text-emerald-600" />}
                title="Smart Clinic Finder"
                description="Clinics ranked by your risk level. See distance, get directions, call directly."
              />
              <FeatureCard
                icon={<AlertTriangle className="h-7 w-7 text-emerald-600" />}
                title="Emergency Support"
                description="When AI detects an emergency, get nearest hospitals with one-tap call buttons."
              />
              <FeatureCard
                icon={<Heart className="h-7 w-7 text-emerald-600" />}
                title="Share & Export"
                description="Print or share your assessment to take to a clinic visit."
              />
            </div>
          </div>
        </section>

        {/* Impact */}
        <section className="border-t border-slate-200 bg-gradient-to-br from-emerald-600 to-teal-700 py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-center text-3xl font-bold text-white">
              Real-world impact
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-center text-emerald-100">
              AfyaAI aims to transform healthcare accessibility across underserved communities.
            </p>
            <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              <ImpactCard
                stat="Early detection"
                description="Reduce preventable deaths through timely risk identification"
              />
              <ImpactCard
                stat="Fewer unnecessary visits"
                description="Minimize overcrowding with smart triage and home-care guidance"
              />
              <ImpactCard
                stat="Maternal & child health"
                description="Support vulnerable groups with targeted recommendations"
              />
              <ImpactCard
                stat="Public health monitoring"
                description="Scalable, cloud-native infrastructure for multi-country deployment"
              />
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-slate-200 bg-white py-20">
          <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
            <h2 className="text-3xl font-bold text-slate-900">
              Ready to get started?
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              Sign up to start your first health assessment and connect with care.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <SignedOut>
                <SignInButton mode="modal">
                  <button className="w-full rounded-xl bg-emerald-600 px-8 py-4 text-base font-semibold text-white transition hover:bg-emerald-700 sm:w-auto">
                    Create Account
                  </button>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                <Link
                  href="/assessment"
                  className="rounded-xl bg-emerald-600 px-8 py-4 text-base font-semibold text-white transition hover:bg-emerald-700"
                >
                  Start Assessment
                </Link>
              </SignedIn>
              <Link
                href="/clinics"
                className="rounded-xl border-2 border-slate-300 px-8 py-4 text-base font-semibold text-slate-700 transition hover:border-emerald-300 hover:bg-slate-50 sm:w-auto"
              >
                Find Clinics
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-slate-900 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <div>
              <Link href="/" className="text-xl font-bold text-white">
                AfyaAI
              </Link>
              <p className="mt-1 text-sm text-slate-400">
                AI-Powered Rural Health Triage & Teleconsultation
              </p>
            </div>
            <div className="flex gap-8">
              <Link href="/clinics" className="text-sm text-slate-400 hover:text-white">
                Find Clinics
              </Link>
              <Link href="/dashboard" className="text-sm text-slate-400 hover:text-white">
                Dashboard
              </Link>
            </div>
          </div>
          <div className="mt-8 border-t border-slate-800 pt-8 text-center text-sm text-slate-500">
            <p>BEORCHID Africa Developers Hackathon 2026</p>
            <p className="mt-1">Submitted by Abdul Hafis Mohammed</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function ProblemCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 transition hover:border-emerald-200 hover:bg-emerald-50/50">
      <h3 className="font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm text-slate-600">{description}</p>
    </div>
  );
}

function StepCard({
  step,
  title,
  description,
  icon,
}: {
  step: number;
  title: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="relative rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition hover:shadow-md">
      <div className="absolute -top-4 left-8 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 text-lg font-bold text-white">
        {step}
      </div>
      <div className="mt-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
        {icon}
      </div>
      <h3 className="mt-6 font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 text-slate-600">{description}</p>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 transition hover:border-emerald-200 hover:shadow-md">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-sm">
        {icon}
      </div>
      <h3 className="mt-4 font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm text-slate-600">{description}</p>
    </div>
  );
}

function ImpactCard({
  stat,
  description,
}: {
  stat: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-emerald-500/30 bg-white/10 p-6 backdrop-blur-sm">
      <p className="font-semibold text-white">{stat}</p>
      <p className="mt-2 text-sm text-emerald-100">{description}</p>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { BackgroundBeams } from '@/components/ui/background-beams';

export default function Home() {
  return (
    <div className="min-h-screen relative w-full bg-neutral-950 antialiased">
      <BackgroundBeams className="absolute inset-0" />

      <div className="relative z-10">
        {/* Navigation */}
        <nav className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
              TaskMaster
            </div>
            <div className="flex gap-4">
              <Link href="/login" className="text-white hover:text-blue-400 transition-colors">
                Sign In
              </Link>
              <Link
                href="/signup"
                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              >
                Get Started
              </Link>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="container mx-auto px-4 py-20 md:py-32">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 animate-fade-in">
              Organize Your Tasks
              <span className="block mt-2 bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
                Boost Your Productivity
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-neutral-300 mb-12 max-w-2xl mx-auto">
              A simple, elegant todo application to help you manage your daily tasks efficiently and achieve your goals faster.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/signup"
                className="relative inline-flex h-12 overflow-hidden rounded-full p-[2px] focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-50"
              >
                <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#393BB2_50%,#E2CBFF_100%)]" />
                <span className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full bg-slate-950 px-8 py-1 text-lg font-medium text-white backdrop-blur-3xl hover:bg-slate-900 transition-colors">
                  Get Started Free
                </span>
              </Link>

              <Link
                href="#features"
                className="inline-flex h-12 items-center justify-center rounded-full border border-slate-700 bg-slate-950/50 px-8 py-1 text-lg font-medium text-white backdrop-blur-sm hover:bg-slate-900/50 hover:border-slate-600 transition-all"
              >
                Learn More
              </Link>
            </div>

            {/* Stats */}
            <div className="mt-16 grid grid-cols-3 gap-8 max-w-2xl mx-auto">
              <div>
                <div className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
                  10K+
                </div>
                <div className="text-neutral-400 text-sm mt-1">Active Users</div>
              </div>
              <div>
                <div className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
                  500K+
                </div>
                <div className="text-neutral-400 text-sm mt-1">Tasks Completed</div>
              </div>
              <div>
                <div className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
                  99.9%
                </div>
                <div className="text-neutral-400 text-sm mt-1">Uptime</div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="container mx-auto px-4 py-20">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Everything You Need to Stay Organized
            </h2>
            <p className="text-xl text-neutral-400 max-w-2xl mx-auto">
              Powerful features designed to help you manage tasks effortlessly
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="bg-slate-950/50 backdrop-blur-sm border border-slate-800 rounded-lg p-6 hover:border-slate-700 transition-all hover:scale-105">
              <div className="text-blue-500 text-4xl mb-4">⚡</div>
              <h3 className="text-xl font-semibold text-white mb-2">Lightning Fast</h3>
              <p className="text-neutral-400">
                Create, edit, and complete tasks in milliseconds. Our optimized interface ensures zero lag.
              </p>
            </div>

            <div className="bg-slate-950/50 backdrop-blur-sm border border-slate-800 rounded-lg p-6 hover:border-slate-700 transition-all hover:scale-105">
              <div className="text-purple-500 text-4xl mb-4">🔒</div>
              <h3 className="text-xl font-semibold text-white mb-2">Bank-Level Security</h3>
              <p className="text-neutral-400">
                Your tasks are encrypted with industry-standard security. Your data is 100% private.
              </p>
            </div>

            <div className="bg-slate-950/50 backdrop-blur-sm border border-slate-800 rounded-lg p-6 hover:border-slate-700 transition-all hover:scale-105">
              <div className="text-green-500 text-4xl mb-4">📱</div>
              <h3 className="text-xl font-semibold text-white mb-2">Cross-Platform Sync</h3>
              <p className="text-neutral-400">
                Access your tasks anywhere. Real-time sync across all your devices.
              </p>
            </div>

            <div className="bg-slate-950/50 backdrop-blur-sm border border-slate-800 rounded-lg p-6 hover:border-slate-700 transition-all hover:scale-105">
              <div className="text-yellow-500 text-4xl mb-4">🎯</div>
              <h3 className="text-xl font-semibold text-white mb-2">Smart Organization</h3>
              <p className="text-neutral-400">
                Filter and organize tasks by status. Find what you need instantly.
              </p>
            </div>

            <div className="bg-slate-950/50 backdrop-blur-sm border border-slate-800 rounded-lg p-6 hover:border-slate-700 transition-all hover:scale-105">
              <div className="text-red-500 text-4xl mb-4">🎨</div>
              <h3 className="text-xl font-semibold text-white mb-2">Beautiful Design</h3>
              <p className="text-neutral-400">
                Clean, modern interface that's a joy to use. Dark mode included.
              </p>
            </div>

            <div className="bg-slate-950/50 backdrop-blur-sm border border-slate-800 rounded-lg p-6 hover:border-slate-700 transition-all hover:scale-105">
              <div className="text-indigo-500 text-4xl mb-4">🚀</div>
              <h3 className="text-xl font-semibold text-white mb-2">Always Improving</h3>
              <p className="text-neutral-400">
                Regular updates with new features based on user feedback.
              </p>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="container mx-auto px-4 py-20">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Get Started in 3 Simple Steps
            </h2>
            <p className="text-xl text-neutral-400 max-w-2xl mx-auto">
              Start managing your tasks in less than a minute
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-blue-600 text-white text-2xl font-bold flex items-center justify-center mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Create Account</h3>
              <p className="text-neutral-400">
                Sign up with your email in seconds. No credit card required.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-purple-600 text-white text-2xl font-bold flex items-center justify-center mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Add Your Tasks</h3>
              <p className="text-neutral-400">
                Create your first task and start organizing your workflow.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-green-600 text-white text-2xl font-bold flex items-center justify-center mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Stay Productive</h3>
              <p className="text-neutral-400">
                Check off tasks as you complete them and watch your productivity soar.
              </p>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="container mx-auto px-4 py-20">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Loved by Productive People
            </h2>
            <p className="text-xl text-neutral-400 max-w-2xl mx-auto">
              See what our users have to say about TaskMaster
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="bg-slate-950/50 backdrop-blur-sm border border-slate-800 rounded-lg p-6">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-yellow-500">★</span>
                ))}
              </div>
              <p className="text-neutral-300 mb-4">
                "TaskMaster has completely transformed how I manage my daily work. The interface is incredibly intuitive!"
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"></div>
                <div>
                  <div className="text-white font-semibold">Sarah Johnson</div>
                  <div className="text-neutral-500 text-sm">Product Manager</div>
                </div>
              </div>
            </div>

            <div className="bg-slate-950/50 backdrop-blur-sm border border-slate-800 rounded-lg p-6">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-yellow-500">★</span>
                ))}
              </div>
              <p className="text-neutral-300 mb-4">
                "Finally, a todo app that doesn't get in the way. Fast, simple, and exactly what I needed."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-green-500 to-blue-500"></div>
                <div>
                  <div className="text-white font-semibold">Michael Chen</div>
                  <div className="text-neutral-500 text-sm">Software Engineer</div>
                </div>
              </div>
            </div>

            <div className="bg-slate-950/50 backdrop-blur-sm border border-slate-800 rounded-lg p-6">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-yellow-500">★</span>
                ))}
              </div>
              <p className="text-neutral-300 mb-4">
                "Love the clean design and real-time sync. I can access my tasks from anywhere!"
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500"></div>
                <div>
                  <div className="text-white font-semibold">Emily Davis</div>
                  <div className="text-neutral-500 text-sm">Freelance Designer</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto px-4 py-20">
          <div className="max-w-4xl mx-auto bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-2xl p-12 text-center">
            <h2 className="text-4xl font-bold text-white mb-4">
              Ready to Get Organized?
            </h2>
            <p className="text-xl text-neutral-300 mb-8">
              Join thousands of productive people using TaskMaster every day
            </p>
            <Link
              href="/signup"
              className="relative inline-flex h-14 overflow-hidden rounded-full p-[2px]"
            >
              <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#393BB2_50%,#E2CBFF_100%)]" />
              <span className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full bg-slate-950 px-12 py-1 text-xl font-medium text-white backdrop-blur-3xl hover:bg-slate-900 transition-colors">
                Start Free Today →
              </span>
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer className="container mx-auto px-4 py-12 border-t border-slate-800">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent mb-4">
                TaskMaster
              </div>
              <p className="text-neutral-400 text-sm">
                The simple, elegant way to manage your tasks and boost productivity.
              </p>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-neutral-400 text-sm">
                <li><Link href="#features" className="hover:text-white transition-colors">Features</Link></li>
                <li><Link href="/tasks" className="hover:text-white transition-colors">Dashboard</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Pricing</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-neutral-400 text-sm">
                <li><Link href="#" className="hover:text-white transition-colors">About</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Blog</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Careers</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-neutral-400 text-sm">
                <li><Link href="#" className="hover:text-white transition-colors">Privacy</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Terms</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Security</Link></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-800 text-center text-neutral-500 text-sm">
            <p>© 2025 TaskMaster. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </div>
  );
}

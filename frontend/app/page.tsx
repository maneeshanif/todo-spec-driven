"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import gsap from "gsap";
import Link from "next/link";
import RippleText from "@/components/RippleText";

// Max Mara Untamed Heroine - Luxury color palette (Cream/Off-white theme)
const colors = {
  bg: "#f8f5f0",         // Warm cream background
  bgAlt: "#f0ebe3",      // Slightly darker cream
  bgDark: "#0a0a0a",     // Dark for intro curtain
  gold: "#c9a962",       // Gold accent
  goldDark: "#a08339",   // Darker gold
  cream: "#faf8f5",      // Light cream
  red: "#8b2635",        // Deep red accent
  redLight: "#a63446",   // Lighter red
  text: "#1a1a1a",       // Dark text
  textLight: "#ffffff",  // Light text for dark bg
  textMuted: "#666666",  // Muted text
  border: "#e5dfd5",     // Cream border
} as const;

type Colors = typeof colors;

export default function Home() {
  const [showIntro, setShowIntro] = useState(true);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);

  // Parallax scroll
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 500], [0, 150]);
  const heroOpacity = useTransform(scrollY, [0, 300], [1, 0]);

  // Initial animation
  useEffect(() => {
    if (!showIntro || !titleRef.current) return;

    gsap.fromTo(
      titleRef.current,
      { opacity: 0, y: 50 },
      {
        opacity: 1,
        y: 0,
        duration: 1.5,
        ease: "power4.out",
        delay: 0.5
      }
    );
  }, [showIntro]);

  const handleEnter = useCallback(() => {
    // Animate title out
    if (titleRef.current) {
        gsap.to(titleRef.current, {
        y: -50,
        opacity: 0,
        duration: 0.8,
        ease: "power3.in",
        });
    }

    // Slide curtain up
    gsap.to(containerRef.current, {
      yPercent: -100,
      duration: 1.2,
      delay: 0.4,
      ease: "power4.inOut",
      onComplete: () => setShowIntro(false),
    });
  }, []);

  const title = "TaskFlow";

  return (
    <div className="relative min-h-screen overflow-hidden" style={{ backgroundColor: colors.bg }}>
      {/* Intro/Curtain - Dark elegant style */}
      <AnimatePresence>
        {showIntro && (
          <motion.div
            ref={containerRef}
            className="fixed inset-0 z-50 flex flex-col"
            style={{ backgroundColor: colors.bgDark }}
            initial={{ opacity: 1 }}
          >
            {/* Decorative corners */}
            <div className="absolute top-8 left-8 w-16 h-16 border-l-2 border-t-2" style={{ borderColor: colors.gold }} />
            <div className="absolute top-8 right-8 w-16 h-16 border-r-2 border-t-2" style={{ borderColor: colors.gold }} />
            <div className="absolute bottom-8 left-8 w-16 h-16 border-l-2 border-b-2" style={{ borderColor: colors.gold }} />
            <div className="absolute bottom-8 right-8 w-16 h-16 border-r-2 border-b-2" style={{ borderColor: colors.gold }} />

            {/* Animated background gradient orbs */}
            <div className="absolute inset-0 overflow-hidden">
              <motion.div
                animate={{
                  x: [0, 100, 0],
                  y: [0, -50, 0],
                  scale: [1, 1.2, 1],
                }}
                transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-20"
                style={{ backgroundColor: colors.gold }}
              />
              <motion.div
                animate={{
                  x: [0, -80, 0],
                  y: [0, 60, 0],
                  scale: [1.2, 1, 1.2],
                }}
                transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
                className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full blur-3xl opacity-15"
                style={{ backgroundColor: colors.red }}
              />
            </div>

            {/* Header */}
            <header className="relative z-10 flex justify-between items-center px-12 py-8">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3, duration: 0.8 }}
                className="text-sm tracking-[0.3em] uppercase"
                style={{ color: colors.gold }}
              >
                TaskFlow®
              </motion.div>
              <motion.nav
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3, duration: 0.8 }}
                className="hidden md:flex gap-12 text-xs tracking-[0.2em] uppercase"
                style={{ color: colors.textMuted }}
              >
                <span className="hover:text-white transition-colors cursor-pointer">Experience</span>
                <span className="hover:text-white transition-colors cursor-pointer">Features</span>
                <span className="hover:text-white transition-colors cursor-pointer">About</span>
              </motion.nav>
            </header>

            {/* Main Content - Centered */}
            <main className="relative z-10 flex-1 flex flex-col justify-center items-center px-8">
              {/* Main Title with magnetic letters */}
              {/* Main Title with liquid ripple effect */}
              <div ref={titleRef} className="w-full h-[30vh] md:h-[40vh] mb-8 relative z-20">
                <RippleText 
                  text={title}
                  className="w-full h-full"
                  fontSize={120}
                  color={colors.goldDark}
                  fontFamily="serif"
                />
              </div>

              {/* Tagline */}
              <motion.p
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.5, duration: 1 }}
                className="text-center text-sm md:text-base tracking-[0.2em] uppercase mb-4 max-w-md"
                style={{ color: colors.textMuted }}
              >
                The Art of Productivity
              </motion.p>

              {/* Subtitle */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.8, duration: 0.8 }}
                className="text-center text-lg md:text-xl font-light max-w-lg"
                style={{ color: colors.cream, opacity: 0.7, fontFamily: "serif", fontStyle: "italic" }}
              >
                Elevate your workflow with elegance
              </motion.p>

              {/* Credit */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2.2, duration: 0.8 }}
                className="mt-8 text-xs tracking-[0.3em] uppercase"
                style={{ color: colors.gold }}
              >
                By: maneeshanif
              </motion.p>
            </main>

            {/* Bottom - Enter Button */}
            <footer className="relative z-10 px-12 py-12">
              <div className="flex flex-col items-center gap-8">
                {/* Enter button */}
                <motion.button
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 2.5, duration: 0.8 }}
                  onClick={handleEnter}
                  className="group relative overflow-hidden px-12 py-4 border transition-all duration-500"
                  style={{ borderColor: colors.gold }}
                >
                  {/* Fill animation */}
                  <span
                    className="absolute inset-0 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-500"
                    style={{ backgroundColor: colors.gold }}
                  />
                  <span
                    className="relative z-10 text-xs tracking-[0.3em] uppercase transition-colors duration-500 group-hover:text-black"
                    style={{ color: colors.gold }}
                  >
                    Enter Experience
                  </span>
                </motion.button>

                {/* Scroll indicator */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.5 }}
                  transition={{ delay: 3, duration: 0.6 }}
                  className="flex flex-col items-center gap-3"
                >
                  <motion.div
                    animate={{ y: [0, 10, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    className="w-[1px] h-12"
                    style={{ backgroundColor: colors.gold }}
                  />
                </motion.div>
              </div>
            </footer>

            {/* Decorative line */}
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.3, duration: 2, ease: [0.16, 1, 0.3, 1] }}
              className="absolute bottom-0 left-0 right-0 h-[1px] origin-left"
              style={{ backgroundColor: colors.gold, opacity: 0.3 }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content after intro */}
      {!showIntro && <MainContent colors={colors} />}
    </div>
  );
}

function MainContent({ colors }: { colors: Colors }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
      className="min-h-screen"
      style={{ backgroundColor: colors.bg }}
    >
      {/* Fixed Header */}
      <header
        className="fixed top-0 left-0 right-0 z-40 flex justify-between items-center px-12 py-6 backdrop-blur-md"
        style={{ backgroundColor: `${colors.bg}ee` }}
      >
        <div className="text-sm tracking-[0.3em] uppercase" style={{ color: colors.goldDark }}>
          TaskFlow®
        </div>
        <nav className="hidden md:flex items-center gap-12">
          <Link href="/login" className="text-xs tracking-[0.2em] uppercase transition-colors hover:opacity-100 opacity-60" style={{ color: colors.text }}>
            Sign In
          </Link>
          <Link
            href="/signup"
            className="text-xs tracking-[0.2em] uppercase px-6 py-3 border transition-all duration-300 hover:bg-[#c9a962] hover:text-white"
            style={{ borderColor: colors.goldDark, color: colors.goldDark }}
          >
            Get Started
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="min-h-screen flex flex-col justify-center items-center px-8 pt-20 relative overflow-hidden">
        {/* Background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-1/3 left-1/4 w-64 h-64 rounded-full blur-3xl opacity-20" style={{ backgroundColor: colors.gold }} />
          <div className="absolute bottom-1/3 right-1/4 w-80 h-80 rounded-full blur-3xl opacity-10" style={{ backgroundColor: colors.red }} />
        </div>

        {/* Decorative frame */}
        <div className="absolute top-20 left-12 w-24 h-24 border-l border-t opacity-20" style={{ borderColor: colors.goldDark }} />
        <div className="absolute top-20 right-12 w-24 h-24 border-r border-t opacity-20" style={{ borderColor: colors.goldDark }} />
        <div className="absolute bottom-12 left-12 w-24 h-24 border-l border-b opacity-20" style={{ borderColor: colors.goldDark }} />
        <div className="absolute bottom-12 right-12 w-24 h-24 border-r border-b opacity-20" style={{ borderColor: colors.goldDark }} />

        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 text-center max-w-4xl"
        >
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="text-xs tracking-[0.4em] uppercase mb-8"
            style={{ color: colors.goldDark }}
          >
            The Future of Productivity
          </motion.p>

          <h1
            className="text-6xl md:text-8xl lg:text-9xl font-extralight leading-[0.9] tracking-[-0.02em] mb-8"
            style={{ color: colors.text, fontFamily: "serif" }}
          >
            Elevate Your
            <br />
            <span style={{ color: colors.goldDark }}>Workflow</span>
          </h1>

          <p
            className="text-lg md:text-xl font-light max-w-xl mx-auto mb-12"
            style={{ color: colors.textMuted, fontFamily: "serif", fontStyle: "italic" }}
          >
            Where elegance meets efficiency. Transform your daily tasks into a refined experience.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link href="/signup">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="group relative overflow-hidden px-12 py-5 transition-all duration-500"
                style={{ backgroundColor: colors.goldDark }}
              >
                <span className="relative z-10 text-xs tracking-[0.3em] uppercase font-medium" style={{ color: colors.textLight }}>
                  Begin Journey
                </span>
              </motion.button>
            </Link>
            <Link href="/login">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="group relative overflow-hidden px-12 py-5 border transition-all duration-500 hover:bg-black/5"
                style={{ borderColor: colors.goldDark, color: colors.text }}
              >
                <span className="relative z-10 text-xs tracking-[0.3em] uppercase">
                  Sign In
                </span>
              </motion.button>
            </Link>
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.8 }}
            className="mt-16 text-xs tracking-[0.3em] uppercase"
            style={{ color: colors.goldDark }}
          >
            By: maneeshanif
          </motion.p>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          transition={{ delay: 1.5, duration: 0.8 }}
          className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4"
        >
          <span className="text-xs tracking-[0.3em] uppercase" style={{ color: colors.textMuted }}>Scroll</span>
          <motion.div
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="w-px h-16"
            style={{ backgroundColor: colors.goldDark }}
          />
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-32 px-8 md:px-16 lg:px-24 relative" style={{ backgroundColor: colors.bgAlt }}>
        {/* Section divider */}
        <div className="absolute top-0 left-12 right-12 h-px" style={{ backgroundColor: colors.border }} />

        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-20"
          >
            <p className="text-xs tracking-[0.4em] uppercase mb-6" style={{ color: colors.goldDark }}>
              Crafted with Excellence
            </p>
            <h2
              className="text-4xl md:text-6xl font-extralight"
              style={{ color: colors.text, fontFamily: "serif" }}
            >
              Refined Features
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: "◆", title: "AI Intelligence", desc: "Smart task suggestions powered by advanced algorithms" },
              { icon: "◈", title: "Voice Control", desc: "Hands-free productivity with natural voice commands" },
              { icon: "◇", title: "Smart Priority", desc: "Automatic prioritization based on your workflow" },
              { icon: "○", title: "Analytics", desc: "Beautiful insights into your productivity patterns" },
              { icon: "□", title: "Cross-Platform", desc: "Seamless sync across all your devices" },
              { icon: "△", title: "Security", desc: "Bank-level encryption for your data" },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.6 }}
                className="group p-8 border transition-all duration-500 hover:border-opacity-100 bg-white/50"
                style={{ borderColor: colors.border }}
              >
                <span
                  className="text-2xl mb-6 block transition-colors duration-300 group-hover:text-[#a08339]"
                  style={{ color: colors.goldDark }}
                >
                  {item.icon}
                </span>
                <h3
                  className="text-xl font-light mb-3 tracking-wide"
                  style={{ color: colors.text }}
                >
                  {item.title}
                </h3>
                <p
                  className="text-sm font-light leading-relaxed"
                  style={{ color: colors.textMuted }}
                >
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonial Section */}
      <section className="py-32 px-8 md:px-16 lg:px-24 relative" style={{ backgroundColor: colors.bg }}>
        <div className="absolute top-0 left-12 right-12 h-px" style={{ backgroundColor: colors.border }} />

        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <p className="text-xs tracking-[0.4em] uppercase mb-12" style={{ color: colors.goldDark }}>
              Testimonials
            </p>
            <blockquote
              className="text-2xl md:text-4xl font-extralight leading-relaxed mb-12"
              style={{ color: colors.text, fontFamily: "serif", fontStyle: "italic" }}
            >
              "TaskFlow has transformed my daily routine into an elegant experience.
              It's not just a todo app—it's a lifestyle upgrade."
            </blockquote>
            <div className="flex items-center justify-center gap-4">
              <div className="w-12 h-12 rounded-full" style={{ backgroundColor: colors.goldDark }} />
              <div className="text-left">
                <p className="text-sm font-medium" style={{ color: colors.text }}>Alexandra Chen</p>
                <p className="text-xs tracking-wider uppercase" style={{ color: colors.textMuted }}>Creative Director</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-8 md:px-16 lg:px-24 relative" style={{ backgroundColor: colors.bgAlt }}>
        <div className="absolute top-0 left-12 right-12 h-px" style={{ backgroundColor: colors.border }} />

        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2
              className="text-4xl md:text-6xl font-extralight mb-8"
              style={{ color: colors.text, fontFamily: "serif" }}
            >
              Begin Your
              <br />
              <span style={{ color: colors.goldDark }}>Journey</span>
            </h2>
            <p
              className="text-lg font-light mb-12"
              style={{ color: colors.textMuted, fontFamily: "serif", fontStyle: "italic" }}
            >
              Join those who've elevated their productivity
            </p>
            <Link href="/signup">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="group relative overflow-hidden px-16 py-6 transition-all duration-500"
                style={{ backgroundColor: colors.goldDark }}
              >
                <span className="relative z-10 text-xs tracking-[0.3em] uppercase font-medium" style={{ color: colors.textLight }}>
                  Get Started Free
                </span>
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-12 relative" style={{ backgroundColor: colors.bg }}>
        <div className="absolute top-0 left-12 right-12 h-px" style={{ backgroundColor: colors.border }} />

        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="text-sm tracking-[0.3em] uppercase" style={{ color: colors.goldDark }}>
              TaskFlow®
            </div>

            <nav className="flex gap-8 text-xs tracking-wider uppercase" style={{ color: colors.textMuted }}>
              <Link href="/login" className="hover:text-[#1a1a1a] transition-colors">Sign In</Link>
              <Link href="/signup" className="hover:text-[#1a1a1a] transition-colors">Get Started</Link>
              <Link href="#features" className="hover:text-[#1a1a1a] transition-colors">Features</Link>
            </nav>

            <p className="text-xs" style={{ color: colors.textMuted }}>
              © 2025 TaskFlow. All rights reserved.
            </p>
          </div>

          <div className="mt-12 text-center">
            <p className="text-xs tracking-[0.3em] uppercase" style={{ color: colors.goldDark }}>
              Created by maneeshanif
            </p>
          </div>
        </div>
      </footer>
    </motion.div>
  );
}

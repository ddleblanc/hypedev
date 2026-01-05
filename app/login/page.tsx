"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { AuthenticatedConnectButton } from "@/components/auth/authenticated-connect-button";
import { Shield, Zap, Users, ArrowRight, Sparkles, LogIn } from "lucide-react";

// Slideshow images with zoom/pan configurations
const slideshowImages = [
  {
    src: "/assets/img/bg1.jpg",
    alt: "Gaming Universe",
    initialScale: 1.2,
    targetScale: 1.4,
    initialX: 0,
    targetX: -5,
    initialY: 0,
    targetY: -3,
  },
  {
    src: "/assets/img/bg2.jpg",
    alt: "Digital Art Gallery",
    initialScale: 1.3,
    targetScale: 1.1,
    initialX: -5,
    targetX: 5,
    initialY: 3,
    targetY: -3,
  },
  {
    src: "/assets/img/bg5.jpg",
    alt: "Gaming World",
    initialScale: 1.1,
    targetScale: 1.3,
    initialX: 5,
    targetX: -3,
    initialY: -3,
    targetY: 5,
  },
  {
    src: "/assets/img/marketplace1.png",
    alt: "Marketplace",
    initialScale: 1.2,
    targetScale: 1.35,
    initialX: 0,
    targetX: 3,
    initialY: 2,
    targetY: -2,
  },
  {
    src: "/assets/img/p2p1.png",
    alt: "Trading",
    initialScale: 1.15,
    targetScale: 1.25,
    initialX: -3,
    targetX: 3,
    initialY: 0,
    targetY: 2,
  },
];

const SLIDE_DURATION = 8000; // 8 seconds per slide

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, status } = useAuth();
  const [currentSlide, setCurrentSlide] = useState(0);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push("/home");
    }
  }, [isAuthenticated, router]);

  // Auto-advance slideshow
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slideshowImages.length);
    }, SLIDE_DURATION);

    return () => clearInterval(timer);
  }, []);

  const currentImage = slideshowImages[currentSlide];

  // Features to display
  const features = [
    {
      icon: Shield,
      title: "Secure & Private",
      description: "Your data stays yours. Always.",
    },
    {
      icon: Zap,
      title: "Instant Access",
      description: "Jump right into the action",
    },
    {
      icon: Users,
      title: "Join the Community",
      description: "Trade with collectors worldwide",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left Side - Image Slideshow (Hidden on mobile, 50% on desktop) */}
      <div className="hidden lg:block lg:w-1/2 relative overflow-hidden bg-black">
        {/* Slideshow Container */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{
              opacity: 0,
              scale: currentImage.initialScale,
              x: `${currentImage.initialX}%`,
              y: `${currentImage.initialY}%`,
            }}
            animate={{
              opacity: 1,
              scale: currentImage.targetScale,
              x: `${currentImage.targetX}%`,
              y: `${currentImage.targetY}%`,
            }}
            exit={{ opacity: 0 }}
            transition={{
              opacity: { duration: 1.5, ease: "easeInOut" },
              scale: { duration: SLIDE_DURATION / 1000, ease: "linear" },
              x: { duration: SLIDE_DURATION / 1000, ease: "linear" },
              y: { duration: SLIDE_DURATION / 1000, ease: "linear" },
            }}
            className="absolute inset-0"
          >
            <Image
              src={currentImage.src}
              alt={currentImage.alt}
              fill
              className="object-cover"
              priority={currentSlide === 0}
              sizes="50vw"
            />
          </motion.div>
        </AnimatePresence>

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-black/80" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/40" />

        {/* Slide Indicators */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {slideshowImages.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`h-1 rounded-full transition-all duration-500 ${
                index === currentSlide
                  ? "w-8 bg-[rgb(163,255,18)]"
                  : "w-2 bg-white/30 hover:bg-white/50"
              }`}
            />
          ))}
        </div>

        {/* Logo Overlay */}
        <div className="absolute top-8 left-8 z-10">
          <Image
            src="/assets/img/logo-text.png"
            alt="HYPERCHAINX"
            width={160}
            height={48}
            className="h-10 w-auto opacity-80"
          />
        </div>

        {/* Quote Overlay */}
        <motion.div
          key={`quote-${currentSlide}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="absolute bottom-24 left-8 right-8 z-10"
        >
          <p className="text-white/90 text-2xl font-light italic">
            &ldquo;The future of gaming is here&rdquo;
          </p>
          <p className="text-white/50 text-sm mt-2">
            Join thousands of collectors and gamers
          </p>
        </motion.div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 lg:w-1/2 flex flex-col min-h-screen bg-[rgb(3,3,3)]">
        {/* Mobile Header Spacer (for AnimatedHeader) */}
        <div className="h-16 lg:h-0" />

        {/* Content */}
        <div className="flex-1 flex flex-col justify-center px-6 py-12 lg:px-16 xl:px-24">
          {/* Mobile Logo */}
          <div className="lg:hidden mb-12 text-center">
            <Image
              src="/assets/img/logo-text.png"
              alt="HYPERCHAINX"
              width={180}
              height={54}
              className="h-12 w-auto mx-auto"
            />
          </div>

          {/* Welcome Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-10"
          >
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-[rgb(163,255,18)]" />
              <span className="text-[rgb(163,255,18)] text-sm font-medium uppercase tracking-wider">
                Welcome
              </span>
            </div>
            <h1 className="text-4xl lg:text-5xl font-black text-white mb-4">
              Sign in to HPX
            </h1>
            <p className="text-white/60 text-lg">
              Join the ultimate gaming ecosystem. Play, trade, and collect
              with the HYPERCHAINX community.
            </p>
          </motion.div>

          {/* Login Button Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-12"
          >
            {/* Styled Login Button Container */}
            <div className="relative">
              {/* Glow Effect */}
              <div className="absolute -inset-1 bg-gradient-to-r from-[rgb(163,255,18)] via-green-400 to-[rgb(163,255,18)] rounded-2xl opacity-20 blur-lg animate-pulse" />

              {/* Button Container */}
              <div className="relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[rgb(163,255,18)] to-green-400 flex items-center justify-center">
                    <LogIn className="w-6 h-6 text-black" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-lg">
                      Continue with
                    </h3>
                    <p className="text-white/50 text-sm">
                      Google, Apple, Email, or any method you prefer
                    </p>
                  </div>
                </div>

                {/* Thirdweb Connect Button - Styled */}
                <div className="[&_button]:w-full [&_button]:!py-4 [&_button]:!rounded-xl [&_button]:!font-bold [&_button]:!text-base">
                  <AuthenticatedConnectButton theme="dark" />
                </div>

                {/* Loading State */}
                {status === "initializing" && (
                  <div className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center">
                    <div className="w-8 h-8 border-2 border-[rgb(163,255,18)] border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>
            </div>

            {/* Security Note */}
            <div className="flex items-center justify-center gap-2 mt-4 text-white/40 text-sm">
              <Shield className="w-4 h-4" />
              <span>Secure, private, and always in your control</span>
            </div>
          </motion.div>

          {/* Features */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            {features.map((feature) => (
              <div
                key={feature.title}
                className="bg-white/5 rounded-xl p-4 border border-white/5 hover:border-white/10 transition-colors"
              >
                <feature.icon className="w-5 h-5 text-[rgb(163,255,18)] mb-2" />
                <h4 className="text-white font-medium text-sm mb-1">
                  {feature.title}
                </h4>
                <p className="text-white/40 text-xs">{feature.description}</p>
              </div>
            ))}
          </motion.div>

          {/* Explore Link */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mt-10 text-center"
          >
            <button
              onClick={() => router.push("/discover")}
              className="inline-flex items-center gap-2 text-white/50 hover:text-white transition-colors group"
            >
              <span>Explore without an account</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>
        </div>

        {/* Footer */}
        <div className="px-6 py-6 border-t border-white/5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-white/30 text-xs">
            <p>&copy; 2024 HYPERCHAINX. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-white/50 transition-colors">
                Terms
              </a>
              <a href="#" className="hover:text-white/50 transition-colors">
                Privacy
              </a>
              <a href="#" className="hover:text-white/50 transition-colors">
                Support
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

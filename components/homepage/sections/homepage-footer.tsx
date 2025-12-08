"use client";

import React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Twitter,
  MessageCircle,
  Github,
  ExternalLink,
  Mail,
  ArrowRight,
  Check,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface FooterLink {
  label: string;
  href: string;
  external?: boolean;
}

interface FooterSection {
  title: string;
  links: FooterLink[];
}

const footerSections: FooterSection[] = [
  {
    title: "Marketplace",
    links: [
      { label: "Explore", href: "/marketplace" },
      { label: "Rankings", href: "/marketplace/rankings" },
      { label: "Collections", href: "/marketplace?filter=collections" },
      { label: "Activity", href: "/activity" },
    ],
  },
  {
    title: "Create",
    links: [
      { label: "Launch Project", href: "/launchpad" },
      { label: "Mint NFT", href: "/studio" },
      { label: "Create Lootbox", href: "/lootboxes/create" },
      { label: "Creator Hub", href: "/creator-onboarding" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Documentation", href: "/docs", external: true },
      { label: "API", href: "/api-docs", external: true },
      { label: "Help Center", href: "/help" },
      { label: "Blog", href: "/blog" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Careers", href: "/careers" },
      { label: "Terms of Service", href: "/terms" },
      { label: "Privacy Policy", href: "/privacy" },
    ],
  },
];

const socialLinks = [
  {
    label: "Twitter",
    href: "https://twitter.com/hyperchainx",
    icon: <Twitter className="w-5 h-5" />,
    hoverColor: "hover:bg-blue-500/20 hover:text-blue-400 hover:border-blue-500/30",
  },
  {
    label: "Discord",
    href: "https://discord.gg/hyperchainx",
    icon: <MessageCircle className="w-5 h-5" />,
    hoverColor: "hover:bg-indigo-500/20 hover:text-indigo-400 hover:border-indigo-500/30",
  },
  {
    label: "GitHub",
    href: "https://github.com/hyperchainx",
    icon: <Github className="w-5 h-5" />,
    hoverColor: "hover:bg-white/10 hover:text-white hover:border-white/20",
  },
];

interface HomepageFooterProps {
  className?: string;
}

function FooterLinkItem({ link }: { link: FooterLink }) {
  const content = (
    <span className="relative inline-flex items-center gap-1 group/link">
      <span className="relative">
        {link.label}
        <span className="absolute left-0 bottom-0 w-0 h-px bg-[rgb(163,255,18)] transition-all duration-300 group-hover/link:w-full" />
      </span>
      {link.external && (
        <ExternalLink className="w-3 h-3 opacity-50 group-hover/link:opacity-100 transition-opacity" />
      )}
    </span>
  );

  if (link.external) {
    return (
      <a
        href={link.href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-white/50 hover:text-white text-sm transition-colors"
      >
        {content}
      </a>
    );
  }

  return (
    <Link
      href={link.href}
      className="text-white/50 hover:text-white text-sm transition-colors"
    >
      {content}
    </Link>
  );
}

export function HomepageFooter({ className }: HomepageFooterProps) {
  const [email, setEmail] = React.useState("");
  const [isSubscribed, setIsSubscribed] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 800));

    setIsSubmitting(false);
    setIsSubscribed(true);
    setEmail("");

    setTimeout(() => setIsSubscribed(false), 4000);
  };

  return (
    <footer
      className={cn(
        "relative bg-zinc-950 border-t border-white/5 overflow-hidden",
        className
      )}
    >
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[rgb(163,255,18)]/[0.02] pointer-events-none" />

      {/* Main Footer Content */}
      <div className="container mx-auto px-4 md:px-8 py-12 md:py-16 relative">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8 md:gap-12">
          {/* Brand Section */}
          <div className="col-span-2">
            <Link href="/" className="inline-block mb-4 group">
              <h3 className="text-2xl font-black text-white">
                HYPER<span className="text-[rgb(163,255,18)] group-hover:text-white transition-colors">CHAINX</span>
              </h3>
            </Link>
            <p className="text-white/60 text-sm mb-6 max-w-xs leading-relaxed">
              The next generation NFT marketplace. Discover, collect, and trade
              digital collectibles on the most innovative platform.
            </p>

            {/* Social Links */}
            <div className="flex gap-3">
              {socialLinks.map((social, index) => (
                <motion.a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center",
                    "bg-white/5 border border-transparent",
                    "text-white/60 transition-all duration-300",
                    social.hoverColor
                  )}
                  aria-label={social.label}
                >
                  {social.icon}
                </motion.a>
              ))}
            </div>
          </div>

          {/* Link Sections */}
          {footerSections.map((section, index) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.05 }}
            >
              <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">
                {section.title}
              </h4>
              <ul className="space-y-2.5">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <FooterLinkItem link={link} />
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Newsletter Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-12 pt-8 border-t border-white/5"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-[rgb(163,255,18)]/10 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5 text-[rgb(163,255,18)]" />
              </div>
              <div>
                <h4 className="text-white font-semibold mb-1">
                  Stay in the loop
                </h4>
                <p className="text-white/50 text-sm">
                  Subscribe to our newsletter for updates, drops, and exclusive content.
                </p>
              </div>
            </div>

            <form
              onSubmit={handleSubscribe}
              className="flex gap-2 w-full md:w-auto"
            >
              <div className="relative flex-1 md:w-64">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  disabled={isSubscribed}
                  className={cn(
                    "pl-10 bg-white/5 border-white/10 h-11",
                    "focus:border-[rgb(163,255,18)]/50 focus:ring-[rgb(163,255,18)]/20",
                    "text-white placeholder:text-white/40",
                    "transition-all duration-300",
                    isSubscribed && "opacity-50"
                  )}
                  required
                />
              </div>
              <Button
                type="submit"
                disabled={isSubmitting || isSubscribed}
                className={cn(
                  "font-semibold h-11 min-w-[120px] transition-all duration-300",
                  isSubscribed
                    ? "bg-green-500 hover:bg-green-500 text-white"
                    : "bg-[rgb(163,255,18)] text-black hover:bg-[rgb(163,255,18)]/90"
                )}
              >
                <AnimatePresence mode="wait">
                  {isSubscribed ? (
                    <motion.span
                      key="subscribed"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex items-center gap-1.5"
                    >
                      <Check className="w-4 h-4" />
                      Subscribed!
                    </motion.span>
                  ) : isSubmitting ? (
                    <motion.span
                      key="submitting"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-2"
                    >
                      <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    </motion.span>
                  ) : (
                    <motion.span
                      key="default"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="flex items-center gap-1"
                    >
                      Subscribe
                      <ArrowRight className="w-4 h-4" />
                    </motion.span>
                  )}
                </AnimatePresence>
              </Button>
            </form>
          </div>
        </motion.div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/5 relative">
        <div className="container mx-auto px-4 md:px-8 py-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-white/40 text-sm">
            <p className="flex items-center gap-2">
              <span>© {new Date().getFullYear()}</span>
              <span className="text-white/60 font-semibold">HYPERCHAINX</span>
              <span className="hidden md:inline">·</span>
              <span className="hidden md:inline">All rights reserved.</span>
            </p>
            <div className="flex items-center gap-6">
              {["Terms", "Privacy", "Cookies"].map((item) => (
                <Link
                  key={item}
                  href={`/${item.toLowerCase()}`}
                  className="hover:text-white transition-colors relative group"
                >
                  {item}
                  <span className="absolute left-0 bottom-0 w-0 h-px bg-white/50 transition-all duration-300 group-hover:w-full" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

"use client";

import { 
  Mail, 
  Phone, 
  MapPin, 
  Facebook, 
  Twitter, 
  Linkedin, 
  Instagram,
  ArrowUp,
  Heart
} from 'lucide-react';
import { useState, useEffect } from 'react';

export default function Footer({ sidebarOpen = true }) {
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const footerLinks = {
    product: [
      { name: 'Dashboard', href: '/dashboard' },
      { name: 'Projects', href: '/projects' },
      { name: 'Events', href: '/events' },
      { name: 'Reports', href: '/reports' }
    ],
    company: [
      { name: 'About Us', href: '/about' },
      { name: 'Careers', href: '/careers' },
      { name: 'Contact', href: '/contact' },
      { name: 'Blog', href: '/blog' }
    ],
    resources: [
      { name: 'Documentation', href: '/docs' },
      { name: 'Help Center', href: '/help' },
      { name: 'API Reference', href: '/api' },
      { name: 'Community', href: '/community' }
    ],
    legal: [
      { name: 'Privacy Policy', href: '/privacy' },
      { name: 'Terms of Service', href: '/terms' },
      { name: 'Cookie Policy', href: '/cookies' },
      { name: 'License', href: '/license' }
    ]
  };

  return (
    <>
      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-orange-400 z-20 animate-slideInFromBottom">
       
        {/* Bottom Bar */}
        <div className="border-t border-orange bg-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              {/* Copyright */}
              <div className="flex items-center gap-2 text-black text-sm animate-fadeInUp animate-delay-100">
                <span>© 2025 PMS/HRMS. Made with</span>
                <Heart size={14} className="text-red-500 fill-current animate-pulse" />
                <span>All rights reserved.</span>
              </div>

              {/* Legal Links */}
              <div className="flex items-center gap-4 text-xs text-black animate-fadeInUp animate-delay-200">
                {footerLinks.legal.map((link, index) => (
                  <a
                    key={link.name}
                    href={link.href}
                    className="hover:text-blue-600 transition-colors duration-200"
                  >
                    {link.name}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Scroll to Top Button */}
        <button
          onClick={scrollToTop}
          className={`footer-scroll-top ${showScrollTop ? 'footer-scroll-top-visible' : ''}`}
          aria-label="Scroll to top"
        >
          <ArrowUp size={20} />
        </button>
      </footer>
    </>
  );
}
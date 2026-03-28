import React, { useState, useEffect } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MessageSquare, Workflow, LayoutGrid, Globe, Zap, Menu, X, ArrowRight } from 'lucide-react';

const LandingNavbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Features', href: '#features' },
    { name: 'Case Study', href: '#cases' },
    { name: 'Sidekick', href: '#sidekick' },
    { name: 'Extension', href: '#extension' }
  ];

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'py-4 bg-obsidian-950/80 backdrop-blur-xl border-b border-obsidian-800' 
          : 'py-6 bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center -rotate-6 group-hover:rotate-0 transition-transform duration-300">
            <Zap className="w-5 h-5 text-obsidian-950 fill-obsidian-950" />
          </div>
          <span className="text-xl font-extrabold tracking-tight text-white">
            DataNest <span className="text-accent">AI</span>
          </span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="text-sm font-medium text-obsidian-300 hover:text-accent transition-colors"
            >
              {link.name}
            </a>
          ))}
        </div>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-4">
          <Link 
            to="/login" 
            className="text-sm font-medium text-obsidian-300 hover:text-white transition-colors"
          >
            Sign In
          </Link>
          <Link 
            to="/register" 
            className="px-5 py-2.5 rounded-full bg-white text-obsidian-950 text-sm font-bold hover:bg-accent transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg shadow-white/5"
          >
            Get Started
          </Link>
        </div>

        {/* Mobile Toggle */}
        <button 
          className="md:hidden text-white"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-obsidian-900 border-b border-obsidian-800 overflow-hidden"
          >
            <div className="flex flex-col gap-4 p-6">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-lg font-medium text-obsidian-300"
                >
                  {link.name}
                </a>
              ))}
              <hr className="border-obsidian-800" />
              <Link to="/login" className="text-lg font-medium text-obsidian-300">Sign In</Link>
              <Link to="/register" className="px-6 py-3 rounded-xl bg-accent text-obsidian-950 font-bold text-center">Get Started</Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default LandingNavbar;

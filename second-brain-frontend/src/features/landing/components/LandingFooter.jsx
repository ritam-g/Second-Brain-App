import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, MessageSquare, Workflow, LayoutGrid, Globe, Zap, Menu, X, ArrowRight, Twitter, Github, Linkedin, Slack } from 'lucide-react';

const LandingFooter = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = [
    {
      title: 'PRODUCT',
      links: [
        { name: 'Features', href: '#features' },
        { name: 'Case Study', href: '#cases' },
        { name: 'Changelog', href: '#' },
        { name: 'Pricing', href: '#' },
      ]
    },
    {
      title: 'DEVELOPER',
      links: [
        { name: 'GitHub', href: '#' },
        { name: 'API Docs', href: '#' },
        { name: 'Status', href: '#' },
        { name: 'Discord', href: '#' },
      ]
    },
    {
      title: 'COMPANY',
      links: [
        { name: 'About Us', href: '#' },
        { name: 'Privacy Policy', href: '#' },
        { name: 'Terms of Service', href: '#' },
        { name: 'Security', href: '#' },
      ]
    }
  ];

  return (
    <footer className="bg-obsidian-950 px-6 py-20 border-t border-obsidian-900 overflow-hidden relative">
      <div className="absolute top-0 right-0 w-1/4 h-1/4 bg-accent/5 blur-[120px] rounded-full pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row justify-between gap-16 lg:gap-24 relative z-10">
        
        {/* Brand Column */}
        <div className="flex-1 max-w-sm">
          <Link to="/" className="flex items-center gap-2 mb-8 group">
            <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center -rotate-6 group-hover:rotate-0 transition-transform duration-300">
              <Zap className="w-6 h-6 text-obsidian-950 fill-obsidian-950" />
            </div>
            <span className="text-2xl font-extrabold tracking-tight text-white">
              DataNest <span className="text-accent underline decoration-accent/20">AI</span>
            </span>
          </Link>
          <p className="text-obsidian-400 font-medium leading-relaxed mb-10">
            Unified for intelligence. Your digital second brain for ideas, simplified by AI. Captures focus, maximizes clarity.
          </p>
          <div className="flex items-center gap-6">
            <a href="https://x.com/maty_ritam" target="_blank" className="text-obsidian-400 hover:text-accent transition-colors"><Twitter className="w-5 h-5" /></a>
            <a href="https://github.com/ritam-g" target="_blank" className="text-obsidian-400 hover:text-accent transition-colors"><Github className="w-5 h-5" /></a>
            <a href="https://www.linkedin.com/in/ritammaty/" target="_blank" className="text-obsidian-400 hover:text-accent transition-colors"><Linkedin className="w-5 h-5" /></a>
            <a href="#" className="text-obsidian-400 hover:text-accent transition-colors"><Slack className="w-5 h-5" /></a>
          </div>
        </div>

        {/* Links Columns */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-12 flex-[1.5]">
          {footerLinks.map((section) => (
            <div key={section.title}>
              <h5 className="text-white font-black text-sm tracking-widest uppercase mb-8">{section.title}</h5>
              <ul className="space-y-4">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <a 
                      href={link.href} 
                      className="text-obsidian-400 hover:text-accent font-medium text-lg transition-colors duration-300"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

      </div>

      <div className="max-w-7xl mx-auto mt-24 pt-8 border-t border-obsidian-900 flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
        <p className="text-obsidian-500 font-bold uppercase tracking-widest text-xs">
          © {currentYear} DataNest AI Inc. All Rights Reserved.
        </p>
        <p className="text-obsidian-500 font-bold uppercase tracking-widest text-xs flex items-center gap-4">
          <span className="hover:text-accent cursor-pointer transition-colors px-2 py-1">Privacy</span>
          <span className="hover:text-accent cursor-pointer transition-colors px-2 py-1">Terms</span>
          <span className="hover:text-accent cursor-pointer transition-colors px-2 py-1">Cookies</span>
        </p>
      </div>
    </footer>
  );
};

export default LandingFooter;

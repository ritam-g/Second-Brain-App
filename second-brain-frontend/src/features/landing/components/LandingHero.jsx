import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Play, Rocket } from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * LandingHero component.
 * Displays the hero section of the landing page with a catchy title, description, and calls to action.
 * 
 * @component
 * @param {Object} props - Component props.
 * @param {string} props.graphImage - URL of the graph visualization image to display.
 * @returns {React.ReactElement} The rendered LandingHero component.
 */
const LandingHero = ({ graphImage }) => {
  return (
    <section className="relative min-h-[140vh] md:min-h-[160vh] flex flex-col items-center pt-32 md:pt-48 overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-[800px] bg-accent/10 blur-[120px] rounded-full pointer-events-none -z-10 opacity-30 animate-pulse" />
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-primary/10 blur-[100px] rounded-full pointer-events-none -z-10 opacity-20" />

      {/* Hero Content */}
      <div className="max-w-7xl mx-auto px-6 text-center z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.1, ease: 'easeOut' }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-obsidian-800/50 border border-obsidian-700/50 text-accent text-xs font-bold tracking-widest uppercase mb-8"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
          </span>
          Intelligence v2.0
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.21, 0.47, 0.32, 0.98] }}
          className="text-5xl md:text-7xl lg:text-8xl font-black text-white leading-tight md:leading-[1.1] tracking-tighter max-w-4xl mx-auto"
        >
          Your AI-Powered <br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#e3eaff] via-[#b8c2ff] to-[#7f95ff] drop-shadow-sm">
            Second Brain
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-8 text-lg md:text-xl text-obsidian-300 max-w-2xl mx-auto font-medium leading-relaxed"
        >
          Caps are everything. Content anything. Recall everything instantly with semantic search and RAG chat.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-6"
        >
          <Link
            to="/register"
            className="group relative px-8 py-4 rounded-full bg-white text-obsidian-950 font-black text-lg hover:bg-accent transition-all duration-300 hover:scale-105 active:scale-95 shadow-2xl shadow-white/10"
          >
            Get Started
            <Rocket className="w-5 h-5 inline-block ml-2 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-300" />
          </Link>
          <a
            href="https://drive.google.com/file/d/1YCjMkUpOn7zer00S5bwIJq7vqMG4NuOO/view?usp=sharing"
            target="_blank"
            rel="noopener noreferrer"
            className="group px-8 py-4 rounded-full bg-obsidian-800/30 border border-obsidian-700 text-white font-bold text-lg hover:bg-obsidian-700 transition-all duration-300 flex items-center gap-3"
          >
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-accent group-hover:text-obsidian-950 transition-colors duration-300">
              <Play className="w-4 h-4 fill-current ml-0.5" />
            </div>
            Watch Demo
          </a>
        </motion.div>
      </div>

      {/* Hero Graph Image */}
      <motion.div
        initial={{ opacity: 0, y: 100, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 1.2, delay: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative mt-20 md:mt-32 w-full max-w-[1400px] mx-auto px-6 h-[400px] md:h-[700px] perspective-2000"
      >
        <div className="relative w-full h-full rounded-[2.5rem] overflow-hidden border border-white/10 shadow-3xl shadow-accent/5 group cursor-zoom-in">
          {/* Subtle overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-obsidian-950 via-transparent to-transparent z-10 opacity-80" />
          <img
            src={graphImage}
            alt="Second Brain Graph Visualization"
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          {/* Scanline effect */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.01),rgba(0,255,0,0.005),rgba(0,0,255,0.01))] bg-[length:100%_2px,3px_100%] pointer-events-none z-20" />
        </div>
      </motion.div>
    </section>
  );
};

export default LandingHero;

import React from 'react';
import { motion } from 'framer-motion';
import { Github, Rocket, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import SectionWrapper from './SectionWrapper';

const LandingCTA = () => {
  return (
    <SectionWrapper className="bg-obsidian-950 pb-32">
      <div className="max-w-4xl mx-auto text-center">
        <motion.h2 
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="text-4xl md:text-6xl font-black text-white leading-tight mb-8"
        >
          Start building your Second Brain today.
        </motion.h2>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-6"
        >
          <Link
            to="/register"
            className="group relative px-10 py-5 rounded-full bg-white text-obsidian-950 font-black text-xl hover:bg-accent transition-all duration-300 hover:scale-105 active:scale-95 shadow-2xl shadow-accent/20"
          >
            Get Started For Free
          </Link>
          <a
            href="https://github.com/ritam-g/Second-Brain-App"
            target="_blank"
            rel="noopener noreferrer"
            className="group px-8 py-5 rounded-full bg-obsidian-800 border border-obsidian-700 text-white font-bold text-lg hover:bg-obsidian-700 transition-all duration-300 flex items-center gap-3"
          >
            <Github className="w-6 h-6" />
            Star on GitHub
            <Star className="w-5 h-5 fill-yellow-500 text-yellow-500 group-hover:scale-125 transition-transform" />
          </a>
        </motion.div>

        <motion.p 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="mt-12 text-obsidian-400 font-bold uppercase tracking-widest text-xs"
        >
          Join 10,000+ thinkers on DataNest AI
        </motion.p>
      </div>
    </SectionWrapper>
  );
};

export default LandingCTA;

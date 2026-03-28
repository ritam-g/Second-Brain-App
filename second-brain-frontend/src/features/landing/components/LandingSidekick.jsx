import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Globe, FileText, Share2, ArrowRight } from 'lucide-react';
import SectionWrapper from './SectionWrapper';

const LandingSidekick = ({ sidekickImg }) => {
  return (
    <SectionWrapper id="sidekick" className="bg-obsidian-950/20 py-32 overflow-hidden">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
        
        {/* Left Column: Text */}
        <div className="flex-1 text-center lg:text-left">
          <motion.h2 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="text-5xl md:text-6xl font-black text-white leading-tight tracking-tighter mb-8"
          >
            The Omnipresent <br /> <span className="text-accent underline decoration-accent/20 underline-offset-8">Sidekick</span>
          </motion.h2>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-xl text-obsidian-300 mb-12 font-medium leading-relaxed max-w-xl mx-auto lg:mx-0"
          >
            The Obsidian Extension lives in your browser, ready to capture sparks of inspiration. Whether it's a code snippet, a tweet, or a full whitepaper, save it instantly and watch the AI process it in the background.
          </motion.p>
          
          <div className="space-y-6 mb-12">
            {[
              { icon: Globe, text: "Save URLs with one click" },
              { icon: FileText, text: "Automatic PDF OCR & Summarizing" },
              { icon: Share2, text: "Instant node tagging & linking" }
            ].map((item, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.15 }}
                className="flex items-center gap-4 text-white font-bold text-lg justify-center lg:justify-start group"
              >
                <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center group-hover:bg-accent group-hover:text-obsidian-950 transition-colors">
                  <item.icon className="w-5 h-5" />
                </div>
                {item.text}
              </motion.div>
            ))}
          </div>
          
          <motion.a 
            href="https://github.com/ritam-g/Second-Brain-App"
            target="_blank"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-8 py-4 rounded-2xl bg-obsidian-800 text-white font-black text-lg border border-obsidian-700 hover:bg-obsidian-700 transition-all flex items-center gap-3 justify-center mx-auto lg:mx-0 shadow-lg shadow-black/30 w-fit"
          >
            Download Extension
            <ArrowRight className="w-5 h-5" />
          </motion.a>
        </div>
        
        {/* Right Column: Visual */}
        <motion.div 
          initial={{ opacity: 0, x: 100, rotate: 5 }}
          whileInView={{ opacity: 1, x: 0, rotate: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="flex-1 relative"
        >
          <div className="relative rounded-[3rem] overflow-hidden border border-white/10 shadow-3xl shadow-accent/5 aspect-video w-[120%] lg:w-[150%] -ml-[10%] lg:ml-0 translate-x-12 lg:scale-110">
            <img 
              src={sidekickImg} 
              alt="Browser Extension Sidebar" 
              className="w-full h-full object-cover"
            />
            {/* Glossy Overlay */}
            <div className="absolute inset-0 bg-gradient-to-tr from-accent/5 via-transparent to-white/5 pointer-events-none" />
          </div>
        </motion.div>
      </div>
    </SectionWrapper>
  );
};

export default LandingSidekick;

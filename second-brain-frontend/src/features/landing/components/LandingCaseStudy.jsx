import React from 'react';
import { motion } from 'framer-motion';
import SectionWrapper from './SectionWrapper';

const LandingCaseStudy = ({ commandCenterImg, neuralImg, ragImg }) => {
  return (
    <SectionWrapper id="cases" className="bg-obsidian-950 pb-20">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <motion.h2 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-4 tracking-tighter"
          >
            Precision Engineering
          </motion.h2>
          <p className="text-obsidian-400 font-medium max-w-2xl mx-auto leading-relaxed">
            Built for deep thinkers, researchers, and creative minds who need a high-fidelity interface for their ideas.
          </p>
        </div>

        <div className="grid md:grid-cols-12 gap-6 h-auto md:h-[800px]">
          {/* Main Large Card - Command Center */}
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="md:col-span-8 group relative rounded-[2.5rem] overflow-hidden bg-obsidian-900/50 border border-obsidian-800 flex flex-col items-center justify-end p-12 transition-all duration-300 hover:border-accent/30 shadow-2xl shadow-black/40"
          >
            <div className="absolute inset-x-0 bottom-0 top-1/4 bg-gradient-to-t from-obsidian-950 via-obsidian-950/20 to-transparent z-10 opacity-90 transition-opacity group-hover:opacity-60" />
            <img 
              src={commandCenterImg} 
              alt="Command Center" 
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            
            <div className="relative z-20 text-center">
              <span className="text-accent text-xs font-black tracking-widest uppercase mb-2 block">Section 1.0</span>
              <h3 className="text-3xl md:text-4xl font-black text-white hover:text-accent cursor-pointer transition-colors duration-300">Command Center</h3>
            </div>
          </motion.div>

          {/* Right Column Grid */}
          <div className="md:col-span-4 flex flex-col gap-6">
            {/* Top Right Card - Neural Design */}
            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="flex-1 group relative rounded-[2.5rem] overflow-hidden bg-obsidian-900 border border-obsidian-800 p-8 flex flex-col items-center justify-end transition-all duration-300 hover:border-accent/30 shadow-2xl shadow-black/40"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-obsidian-950 via-transparent to-transparent z-10 opacity-70" />
              <img 
                src={neuralImg} 
                alt="Neural Design" 
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              />
              <div className="relative z-20 text-center">
                <h3 className="text-xl md:text-2xl font-black text-white tracking-tight group-hover:text-accent transition-colors">Neural Design</h3>
              </div>
            </motion.div>

            {/* Bottom Right Card - RAG Interface */}
            <motion.div 
              initial={{ opacity: 0, x: 50, y: 50 }}
              whileInView={{ opacity: 1, x: 0, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="flex-1 group relative rounded-[2.5rem] overflow-hidden bg-obsidian-900 border border-obsidian-800 p-8 flex flex-col items-center justify-end transition-all duration-300 hover:border-accent/30 shadow-2xl shadow-black/40"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-obsidian-950 via-transparent to-transparent z-10 opacity-70" />
              <img 
                src={ragImg} 
                alt="RAG Interface" 
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              />
              <div className="relative z-20 text-center">
                <h3 className="text-xl md:text-2xl font-black text-white tracking-tight group-hover:text-accent transition-colors">RAG Interface</h3>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </SectionWrapper>
  );
};

export default LandingCaseStudy;

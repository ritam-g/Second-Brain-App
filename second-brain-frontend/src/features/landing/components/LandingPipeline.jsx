import React from 'react';
import { motion } from 'framer-motion';
import { Save, Cpu, HardDrive, Share2, MessageCircle } from 'lucide-react';
import SectionWrapper from './SectionWrapper';

const steps = [
  { icon: Save, label: 'Save', detail: 'URL & Files' },
  { icon: Cpu, label: 'Process', detail: 'Summarization' },
  { icon: HardDrive, label: 'Collect', detail: 'Vector DB' },
  { icon: Share2, label: 'Connect', detail: 'Knowledge Graph' },
  { icon: MessageCircle, label: 'Chat', detail: 'Retrieval' },
];

const LandingPipeline = () => {
  return (
    <SectionWrapper className="bg-obsidian-900/10">
      <div className="max-w-7xl mx-auto text-center px-4">
        <motion.h2 
          className="text-4xl md:text-5xl font-black text-white mb-6 uppercase tracking-tighter"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          The Information Pipeline
        </motion.h2>
        <p className="text-obsidian-400 font-medium mb-16">Seamlessly transition from chaos to clarity</p>

        <div className="relative flex flex-col md:flex-row items-center justify-between gap-12 md:gap-4 overflow-x-auto pb-12 scrollbar-hide">
          {/* Connector Line (Desktop) */}
          <div className="absolute top-[40px] left-10 right-10 h-[2px] bg-gradient-to-r from-transparent via-accent/30 to-transparent hidden md:block" />
          
          {steps.map((step, idx) => (
            <motion.div
              key={step.label}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="flex flex-col items-center group relative z-10 min-w-[120px]"
            >
              <div className="w-20 h-20 rounded-full bg-obsidian-800 border border-obsidian-700 flex items-center justify-center mb-6 group-hover:bg-white group-hover:text-obsidian-950 group-hover:scale-110 shadow-2xl transition-all duration-300">
                <step.icon className="w-8 h-8" />
              </div>
              <h4 className="text-white font-black text-lg mb-1">{step.label}</h4>
              <p className="text-obsidian-400 text-xs font-bold uppercase tracking-widest">{step.detail}</p>
              
              {/* Connector (Mobile) */}
              {idx < steps.length - 1 && (
                <div className="w-[1px] h-12 bg-accent/20 md:hidden mt-4" />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </SectionWrapper>
  );
};

export default LandingPipeline;

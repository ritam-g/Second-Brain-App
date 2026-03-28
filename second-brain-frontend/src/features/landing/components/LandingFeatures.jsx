import React from 'react';
import { motion } from 'framer-motion';
import { Search, MessageSquare, Workflow, LayoutGrid, Globe, Zap } from 'lucide-react';
import SectionWrapper from './SectionWrapper';

const features = [
  {
    icon: Search,
    title: 'Semantic Search',
    description: 'Find concepts, not just keywords. Our vector-based engine understands the context of your notes.',
    color: 'bg-indigo-500/10 text-indigo-400'
  },
  {
    icon: MessageSquare,
    title: 'RAG Chat',
    description: 'Converse with your entire knowledge base. Get precise answers using your actual documents.',
    color: 'bg-purple-500/10 text-purple-400'
  },
  {
    icon: Workflow,
    title: 'Knowledge Graph',
    description: 'Visualize hidden connections. Watch your brain-power orchestrator automatically link topics.',
    color: 'bg-yellow-500/10 text-yellow-500'
  },
  {
    icon: LayoutGrid,
    title: 'Smart Tagging',
    description: 'AI automatically classifies your content, so you never have to spend hours organizing folders.',
    color: 'bg-blue-500/10 text-blue-400'
  },
  {
    icon: Globe,
    title: 'Browser Extension',
    description: 'Save snippets, full pages, or research papers directly to your Second Brain with one click.',
    color: 'bg-pink-500/10 text-pink-400'
  },
  {
    icon: Zap,
    title: 'Resurfacing',
    description: 'Avoid the black hole of notes. Smart reminders bring back relevant info exactly when you need it.',
    color: 'bg-green-500/10 text-green-400'
  }
];

const FeatureCard = ({ feature, index }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -10 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="p-8 rounded-[2rem] bg-obsidian-900/40 border border-obsidian-800 hover:border-accent/40 group relative overflow-hidden transition-all duration-300 shadow-xl shadow-black/20"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 blur-[50px] rounded-full group-hover:bg-accent/10 transition-colors" />
      
      <div className={`w-12 h-12 rounded-2xl ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300`}>
        <feature.icon className="w-6 h-6" />
      </div>
      
      <h3 className="text-xl font-bold text-white mb-4 tracking-tight group-hover:text-accent transition-colors">
        {feature.title}
      </h3>
      
      <p className="text-obsidian-300 leading-relaxed font-medium">
        {feature.description}
      </p>
    </motion.div>
  );
};

const LandingFeatures = () => {
  return (
    <SectionWrapper id="features" className="bg-obsidian-950 pb-20">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col items-center gap-4"
          >
            <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter">
              Master Your Information
            </h2>
            <div className="w-20 h-1 bg-accent rounded-full" />
          </motion.div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, idx) => (
            <FeatureCard key={feature.title} feature={feature} index={idx} />
          ))}
        </div>
      </div>
    </SectionWrapper>
  );
};

export default LandingFeatures;

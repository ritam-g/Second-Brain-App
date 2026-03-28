import React, { useEffect } from 'react';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';

// Components
import LandingNavbar from '../features/landing/components/LandingNavbar';
import LandingHero from '../features/landing/components/LandingHero';
import LandingFeatures from '../features/landing/components/LandingFeatures';
import LandingPipeline from '../features/landing/components/LandingPipeline';
import LandingCaseStudy from '../features/landing/components/LandingCaseStudy';
import LandingSidekick from '../features/landing/components/LandingSidekick';
import LandingCTA from '../features/landing/components/LandingCTA';
import LandingFooter from '../features/landing/components/LandingFooter';

// Assets
import heroGraph from '../assets/landing/hero_graph_visualization.png';
import commandCenter from '../assets/landing/command_center_mobile_mockup.png';
import neuralDesign from '../assets/landing/neural_design_abstract.png';
import ragInterface from '../assets/landing/rag_interface_mockup_desktop_slim.png';
import sidekickImg from '../assets/landing/omnipresent_sidekick_browser_overlay.png';

const LandingPage = () => {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      smoothTouch: false,
      touchMultiplier: 2,
      infinite: false,
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, []);

  return (
    <div className="bg-obsidian-950 min-h-screen text-white overflow-x-hidden selection:bg-accent selection:text-obsidian-950">
      <LandingNavbar />
      
      <main>
        <LandingHero graphImage={heroGraph} />
        <LandingFeatures />
        <LandingPipeline />
        <LandingCaseStudy 
          commandCenterImg={commandCenter} 
          neuralImg={neuralDesign} 
          ragImg={ragInterface} 
        />
        <LandingSidekick sidekickImg={sidekickImg} />
        <LandingCTA />
      </main>

      <LandingFooter />
    </div>
  );
};

export default LandingPage;

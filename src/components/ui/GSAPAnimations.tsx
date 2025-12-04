'use client';

import { useEffect } from 'react';

// GSAP Animations Component - Optimized for Next.js SSR compatibility
export default function GSAPAnimations() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let gsap: any = null;
    let ScrollTrigger: any = null;

    // Initialize GSAP dynamically
    const initializeGSAP = async () => {
      try {
        // Dynamic import for proper Next.js SSR compatibility
        const gsapModule = await import('gsap');
        const scrollTriggerModule = await import('gsap/ScrollTrigger');
        
        gsap = gsapModule.gsap || gsapModule.default;
        ScrollTrigger = scrollTriggerModule.ScrollTrigger || scrollTriggerModule.default;
        
        if (gsap && ScrollTrigger) {
          gsap.registerPlugin(ScrollTrigger);
          
          // Scroll animations for items
          const scrollItems = document.querySelectorAll('.scroll-item');
          scrollItems.forEach((item, i) => {
            gsap.to(item, {
              scrollTrigger: {
                trigger: item,
                start: "top 95%",
                toggleActions: "play none none reverse"
              },
              y: 0,
              opacity: 1,
              filter: "blur(0px)",
              duration: 0.8,
              delay: i * 0.1,
              ease: "power2.out"
            });
          });
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('Failed to initialize GSAP animations:', error);
        }
      }
    };

    initializeGSAP();

    // Cleanup function
    return () => {
      if (ScrollTrigger && ScrollTrigger.getAll) {
        ScrollTrigger.getAll().forEach((trigger: any) => trigger.kill());
      }
    };
  }, []);

  // This component doesn't render anything visible
  return null;
}
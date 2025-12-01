"use client";

import { useEffect } from "react";
import Balatro from "@/components/Balatro";

export default function TestBalatroSimple() {
  useEffect(() => {
    // Clear console and add a marker
    console.clear();
    console.log("=== SIMPLE BALATRO TEST PAGE LOADED ===");
    
    // Add global error handler to catch any unhandled errors
    const handleError = (event: ErrorEvent) => {
      console.error("=== GLOBAL ERROR CAUGHT ===");
      console.error("Error:", event.error);
      console.error("Message:", event.message);
      console.error("Filename:", event.filename);
      console.error("Line:", event.lineno, "Column:", event.colno);
      console.error("=== END GLOBAL ERROR ===");
    };
    
    window.addEventListener('error', handleError);
    
    return () => {
      window.removeEventListener('error', handleError);
    };
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', background: '#000' }}>
      <div style={{ 
        position: 'absolute', 
        top: '10px', 
        left: '10px', 
        zIndex: 1000, 
        background: 'rgba(0,0,0,0.8)', 
        color: 'white', 
        padding: '10px',
        borderRadius: '5px',
        fontSize: '12px'
      }}>
        <h3>Simple Balatro Test</h3>
        <p>No authentication required</p>
        <p>Check browser console for debug output</p>
      </div>
      
      <Balatro isRotate={false} mouseInteraction={true} pixelFilter={700} />
    </div>
  );
}
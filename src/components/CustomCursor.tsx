
'use client';

import React, { useEffect, useRef, useState } from 'react';

const OUTER_VISUAL_DIAMETER = 32; // px
const OUTER_BORDER_WIDTH = 2;    // px
const INNER_DOT_DIAMETER = 6;    // px
const EASING_FACTOR = 0.18;

const CustomCursor: React.FC = () => {
  const outerCircleRef = useRef<HTMLDivElement>(null);
  const innerDotRef = useRef<HTMLDivElement>(null);

  // Initialize positions off-screen or at 0,0. They will be updated on first mouse move.
  const mousePosition = useRef({ x: 0, y: 0 });
  const dotLogicalPosition = useRef({ x: 0, y: 0 });
  
  const [isMounted, setIsMounted] = useState(false); // To control client-side only rendering
  const animationFrameIdRef = useRef<number | null>(null);

  useEffect(() => {
    // This effect runs once after the initial client render to mark the component as mounted.
    setIsMounted(true);
  }, []);

  useEffect(() => {
    // This effect contains all the logic for cursor movement and DOM manipulation.
    // It will only run if isMounted is true, meaning only on the client after the initial render.
    if (!isMounted) {
      return; // Do nothing if not mounted on the client yet
    }

    const outerEl = outerCircleRef.current;
    const dotEl = innerDotRef.current;

    // This check should ideally not be necessary if isMounted logic is correct,
    // but as a safeguard:
    if (!outerEl || !dotEl) {
      console.warn("CustomCursor refs not available even after mount.");
      return;
    }
    
    // Set initial positions based on first mouse move after mount
    // This ensures the cursor doesn't jump from (0,0)
    let initialPositionsSet = false;
    const setInitialPositions = (event: MouseEvent) => {
        if (!initialPositionsSet) {
            mousePosition.current = { x: event.clientX, y: event.clientY };
            dotLogicalPosition.current = { x: event.clientX, y: event.clientY };
            
            outerEl.style.transform = `translate(${mousePosition.current.x - OUTER_VISUAL_DIAMETER / 2}px, ${mousePosition.current.y - OUTER_VISUAL_DIAMETER / 2}px)`;
            dotEl.style.transform = `translate(${dotLogicalPosition.current.x - INNER_DOT_DIAMETER / 2}px, ${dotLogicalPosition.current.y - INNER_DOT_DIAMETER / 2}px)`;
            
            // Make them visible now
            outerEl.style.opacity = '1';
            dotEl.style.opacity = '1';
            initialPositionsSet = true;
        }
         // We can remove this specific listener if it was only for one-time init,
         // but handleMouseMove will continue to update mousePosition.current
    };


    const handleMouseMove = (event: MouseEvent) => {
      if (!initialPositionsSet) { // Ensure initial positions are set on the very first move
          setInitialPositions(event);
      }
      mousePosition.current = { x: event.clientX, y: event.clientY };
    };

    const updateCursorPositions = () => {
      if (!outerEl || !dotEl || !initialPositionsSet) { 
        animationFrameIdRef.current = requestAnimationFrame(updateCursorPositions);
        return;
      }

      outerEl.style.transform = `translate(${mousePosition.current.x - OUTER_VISUAL_DIAMETER / 2}px, ${mousePosition.current.y - OUTER_VISUAL_DIAMETER / 2}px)`;
      
      dotLogicalPosition.current.x += (mousePosition.current.x - dotLogicalPosition.current.x) * EASING_FACTOR;
      dotLogicalPosition.current.y += (mousePosition.current.y - dotLogicalPosition.current.y) * EASING_FACTOR;
      
      const outerCenterX = mousePosition.current.x;
      const outerCenterY = mousePosition.current.y;
      
      const deltaX = dotLogicalPosition.current.x - outerCenterX;
      const deltaY = dotLogicalPosition.current.y - outerCenterY;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      
      // Max distance the dot's center can be from the outer circle's center while staying inside
      const maxDotDistance = (OUTER_VISUAL_DIAMETER / 2) - (INNER_DOT_DIAMETER / 2) - (OUTER_BORDER_WIDTH / 2);


      let finalDotX = dotLogicalPosition.current.x;
      let finalDotY = dotLogicalPosition.current.y;

      if (distance > maxDotDistance && maxDotDistance > 0) { // Ensure maxDotDistance is positive
        const angle = Math.atan2(deltaY, deltaX);
        finalDotX = outerCenterX + Math.cos(angle) * maxDotDistance;
        finalDotY = outerCenterY + Math.sin(angle) * maxDotDistance;
      }
      
      dotEl.style.transform = `translate(${finalDotX - INNER_DOT_DIAMETER / 2}px, ${finalDotY - INNER_DOT_DIAMETER / 2}px)`;

      animationFrameIdRef.current = requestAnimationFrame(updateCursorPositions);
    };
    
    document.body.style.cursor = 'none'; // Hide system cursor
    window.addEventListener('mousemove', handleMouseMove, true); // Use capture phase for initial position
    animationFrameIdRef.current = requestAnimationFrame(updateCursorPositions);

    return () => {
      document.body.style.cursor = 'auto'; // Restore system cursor
      window.removeEventListener('mousemove', handleMouseMove, true);
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, [isMounted]); // This effect depends on isMounted

  // Render nothing on the server and during the first client render pass
  if (!isMounted) {
    return null; 
  }

  // Once mounted, render the cursor elements. Their styles are static here.
  // JS will handle their opacity (already 0 by default) and transform.
  return (
    <>
      <div
        ref={outerCircleRef}
        className="fixed rounded-full pointer-events-none" // Base classes
        style={{
          width: `${OUTER_VISUAL_DIAMETER}px`,
          height: `${OUTER_VISUAL_DIAMETER}px`,
          border: `${OUTER_BORDER_WIDTH}px solid hsl(var(--primary))`,
          zIndex: 99999,
          opacity: 0, // Initially hidden, made visible by JS after first mouse move
          top: 0, 
          left: 0,
          willChange: 'transform, opacity',
          transition: 'opacity 0.1s ease-out',
        }}
      />
      <div
        ref={innerDotRef}
        className="fixed rounded-full pointer-events-none" // Base classes
        style={{
          width: `${INNER_DOT_DIAMETER}px`,
          height: `${INNER_DOT_DIAMETER}px`,
          backgroundColor: 'hsl(var(--primary))',
          zIndex: 99999,
          opacity: 0, // Initially hidden
          top: 0,
          left: 0,
          willChange: 'transform, opacity',
          transition: 'opacity 0.1s ease-out',
        }}
      />
    </>
  );
};

export default CustomCursor;

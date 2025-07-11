
'use client';

import React, { useEffect, useRef, useState } from 'react';

const OUTER_VISUAL_DIAMETER = 32; // px
const OUTER_BORDER_WIDTH = 2;    // px
const INNER_DOT_DIAMETER = 6;    // px
const EASING_FACTOR = 0.18;

const CustomCursor: React.FC = () => {
  const outerCircleRef = useRef<HTMLDivElement>(null);
  const innerDotRef = useRef<HTMLDivElement>(null);

  const mousePosition = useRef({ x: 0, y: 0 });
  const dotLogicalPosition = useRef({ x: 0, y: 0 });
  
  const [isMounted, setIsMounted] = useState(false);
  const animationFrameIdRef = useRef<number | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) {
      return;
    }

    const outerEl = outerCircleRef.current;
    const dotEl = innerDotRef.current;

    if (!outerEl || !dotEl) {
      console.warn("CustomCursor refs not available even after mount.");
      return;
    }
    
    // Make cursor visible and set initial position immediately on mount
    outerEl.style.opacity = '1';
    dotEl.style.opacity = '1';

    let initialX = window.innerWidth / 2;
    let initialY = window.innerHeight / 2;

    // Attempt to use last known mouse position if available, otherwise center
    // This part is tricky as mouse position isn't tracked before first move event
    // We'll initialize to center, and first mousemove will correct it.
    mousePosition.current = { x: initialX, y: initialY };
    dotLogicalPosition.current = { x: initialX, y: initialY };
    
    outerEl.style.transform = `translate(${mousePosition.current.x - OUTER_VISUAL_DIAMETER / 2}px, ${mousePosition.current.y - OUTER_VISUAL_DIAMETER / 2}px)`;
    dotEl.style.transform = `translate(${dotLogicalPosition.current.x - INNER_DOT_DIAMETER / 2}px, ${dotLogicalPosition.current.y - INNER_DOT_DIAMETER / 2}px)`;

    const handleMouseMove = (event: MouseEvent) => {
      mousePosition.current = { x: event.clientX, y: event.clientY };
    };

    const updateCursorPositions = () => {
      const currentOuterEl = outerCircleRef.current; // Re-access ref inside loop
      const currentDotEl = innerDotRef.current;   // Re-access ref inside loop

      if (!currentOuterEl || !currentDotEl) { 
        animationFrameIdRef.current = requestAnimationFrame(updateCursorPositions);
        return;
      }

      currentOuterEl.style.transform = `translate(${mousePosition.current.x - OUTER_VISUAL_DIAMETER / 2}px, ${mousePosition.current.y - OUTER_VISUAL_DIAMETER / 2}px)`;
      
      dotLogicalPosition.current.x += (mousePosition.current.x - dotLogicalPosition.current.x) * EASING_FACTOR;
      dotLogicalPosition.current.y += (mousePosition.current.y - dotLogicalPosition.current.y) * EASING_FACTOR;
      
      const outerCenterX = mousePosition.current.x;
      const outerCenterY = mousePosition.current.y;
      
      const deltaX = dotLogicalPosition.current.x - outerCenterX;
      const deltaY = dotLogicalPosition.current.y - outerCenterY;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      
      const maxDotDistance = (OUTER_VISUAL_DIAMETER / 2) - (INNER_DOT_DIAMETER / 2) - (OUTER_BORDER_WIDTH / 2);

      let finalDotX = dotLogicalPosition.current.x;
      let finalDotY = dotLogicalPosition.current.y;

      if (distance > maxDotDistance && maxDotDistance > 0) {
        const angle = Math.atan2(deltaY, deltaX);
        finalDotX = outerCenterX + Math.cos(angle) * maxDotDistance;
        finalDotY = outerCenterY + Math.sin(angle) * maxDotDistance;
      }
      
      currentDotEl.style.transform = `translate(${finalDotX - INNER_DOT_DIAMETER / 2}px, ${finalDotY - INNER_DOT_DIAMETER / 2}px)`;

      animationFrameIdRef.current = requestAnimationFrame(updateCursorPositions);
    };
    
    document.body.style.cursor = 'none';
    window.addEventListener('mousemove', handleMouseMove);
    animationFrameIdRef.current = requestAnimationFrame(updateCursorPositions);

    return () => {
      document.body.style.cursor = 'auto';
      window.removeEventListener('mousemove', handleMouseMove);
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
      // Optionally reset opacity if the component were to unmount, though it's a global cursor
      // if (outerEl) outerEl.style.opacity = '0';
      // if (dotEl) dotEl.style.opacity = '0';
    };
  }, [isMounted]);

  if (!isMounted) {
    return null; 
  }

  return (
    <>
      <div
        ref={outerCircleRef}
        className="fixed rounded-full pointer-events-none"
        style={{
          width: `${OUTER_VISUAL_DIAMETER}px`,
          height: `${OUTER_VISUAL_DIAMETER}px`,
          border: `${OUTER_BORDER_WIDTH}px solid hsl(var(--primary))`,
          zIndex: 99999,
          opacity: 0, // JS will set to 1
          top: 0, 
          left: 0,
          willChange: 'transform, opacity',
          transition: 'opacity 0.1s ease-out', // For smoother appearance
        }}
      />
      <div
        ref={innerDotRef}
        className="fixed rounded-full pointer-events-none"
        style={{
          width: `${INNER_DOT_DIAMETER}px`,
          height: `${INNER_DOT_DIAMETER}px`,
          backgroundColor: 'hsl(var(--primary))',
          zIndex: 99999,
          opacity: 0, // JS will set to 1
          top: 0,
          left: 0,
          willChange: 'transform, opacity',
          transition: 'opacity 0.1s ease-out', // For smoother appearance
        }}
      />
    </>
  );
};

export default CustomCursor;


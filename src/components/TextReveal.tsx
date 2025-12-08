'use client'

import { useEffect, useState, useRef } from 'react'

interface TextRevealProps {
  text: string
  className?: string
  delay?: number
  triggerOnScroll?: boolean // New prop to control if animation waits for scroll trigger
}

export default function TextReveal({ text, className = '', delay = 0, triggerOnScroll = false }: TextRevealProps) {
  const [shouldAnimate, setShouldAnimate] = useState(false)
  const [isInView, setIsInView] = useState(false)
  const elementRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    // If not triggered by scroll, animate immediately after mount
    if (!triggerOnScroll) {
      const timer = setTimeout(() => {
        setShouldAnimate(true)
      }, 50) // Small delay to ensure DOM is ready

      return () => clearTimeout(timer)
    }
  }, [triggerOnScroll])

  // IntersectionObserver for scroll-triggered animations
  useEffect(() => {
    if (!triggerOnScroll || !elementRef.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true)
            setShouldAnimate(true)
          }
        })
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
      }
    )

    observer.observe(elementRef.current)

    return () => observer.disconnect()
  }, [triggerOnScroll])

  // Split text into individual characters, preserving spaces
  const characters = text.split('').map((char, index) => {
    // Handle spaces properly using &nbsp;
    if (char === ' ') {
      return {
        char: '\u00A0', // Non-breaking space
        delay: delay + (index * 0.05), // 0.05s stagger per character
        isSpace: true
      }
    }
    return {
      char,
      delay: delay + (index * 0.05), // 0.05s stagger per character
      isSpace: false
    }
  })

  return (
    <span ref={elementRef} className={className}>
      {characters.map((item, index) => (
        <span
          key={index}
          className="text-reveal-letter"
          style={{
            display: 'inline-block',
            opacity: shouldAnimate ? undefined : 0,
            transform: shouldAnimate ? undefined : 'translateY(110%)',
            animationDelay: shouldAnimate ? `${item.delay}s` : undefined,
            animationPlayState: shouldAnimate && (!triggerOnScroll || isInView) ? 'running' : 'paused',
            animationFillMode: 'both'
          }}
        >
          {item.char}
        </span>
      ))}
    </span>
  )
}
'use client';

import React from 'react';

interface SkeletonLoaderProps {
  type?: 'card' | 'text' | 'table' | 'chart';
  count?: number;
  className?: string;
}

export default function SkeletonLoader({ type = 'card', count = 1, className = '' }: SkeletonLoaderProps) {
  const renderSkeleton = () => {
    switch (type) {
      case 'card':
        return (
          <div className={`p-6 rounded-lg ${className}`} style={{
            backgroundColor: 'var(--soft-graphite)',
            border: '0.8px solid var(--border-primary)',
            borderRadius: 'var(--radius-card)',
            backdropFilter: 'blur(var(--glass-morphism-blur))',
            WebkitBackdropFilter: 'blur(var(--glass-morphism-blur))'
          }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="skeleton w-5 h-5 rounded-full"></div>
              <div className="h-4 w-24 rounded animate-pulse" style={{
                backgroundColor: 'rgba(184, 155, 94, 0.2)',
                borderRadius: 'var(--radius-small)'
              }}></div>
            </div>
            <div className="skeleton skeleton-text large w-32 mb-2"></div>
            <div className="h-4 w-48 rounded animate-pulse" style={{
              backgroundColor: 'rgba(184, 155, 94, 0.2)',
              borderRadius: 'var(--radius-small)'
            }}></div>
          </div>
        );
      
      case 'text':
        return (
          <div className={`space-y-2 ${className}`}>
            <div className="skeleton skeleton-text"></div>
            <div className="skeleton skeleton-text w-4/5"></div>
            <div className="skeleton skeleton-text w-3/5"></div>
          </div>
        );
      
      case 'table':
        return (
          <div className={`glass-enhanced p-6 rounded-xl ${className}`}>
            <div className="space-y-3">
              {/* Table header */}
              <div className="grid grid-cols-6 gap-4 pb-3 border-b border-white/10">
                <div className="skeleton skeleton-text small"></div>
                <div className="skeleton skeleton-text small"></div>
                <div className="skeleton skeleton-text small"></div>
                <div className="skeleton skeleton-text small"></div>
                <div className="skeleton skeleton-text small"></div>
                <div className="skeleton skeleton-text small"></div>
              </div>
              
              {/* Table rows */}
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="grid grid-cols-6 gap-4 py-3">
                  <div className="skeleton skeleton-text small"></div>
                  <div className="skeleton skeleton-text small"></div>
                  <div className="skeleton skeleton-text small w-16"></div>
                  <div className="skeleton skeleton-text small w-12"></div>
                  <div className="skeleton skeleton-text small w-20"></div>
                  <div className="skeleton skeleton-text small w-24"></div>
                </div>
              ))}
            </div>
          </div>
        );
      
      case 'chart':
        return (
          <div className={`chart-container-enhanced ${className}`}>
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="skeleton w-16 h-16 rounded-full mx-auto mb-4"></div>
                <div className="skeleton skeleton-text w-32 mx-auto"></div>
              </div>
            </div>
          </div>
        );
      
      default:
        return <div className={`skeleton skeleton-card ${className}`}></div>;
    }
  };

  return (
    <div className="stagger-animation">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="mb-4">
          {renderSkeleton()}
        </div>
      ))}
    </div>
  );
}

// Specific skeleton components for different use cases
export const StatCardSkeleton = () => (
  <div className="p-6 rounded-lg hover-lift" style={{
        backgroundColor: 'var(--soft-graphite)',
        border: '0.8px solid var(--border-primary)',
        borderRadius: 'var(--radius-card)',
        backdropFilter: 'blur(var(--glass-morphism-blur))',
        WebkitBackdropFilter: 'blur(var(--glass-morphism-blur))'
      }}>
    <div className="flex items-center gap-3 mb-2">
      <div className="skeleton w-5 h-5 rounded-full"></div>
      <div className="skeleton skeleton-text small w-24"></div>
    </div>
    <div className="skeleton skeleton-text large w-32"></div>
  </div>
);

export const FilterSectionSkeleton = () => (
  <div className="filter-section-enhanced">
    <div className="skeleton skeleton-text large w-32 mb-4"></div>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index}>
          <div className="skeleton skeleton-text small w-20 mb-2"></div>
          <div className="skeleton h-10 rounded-lg"></div>
        </div>
      ))}
    </div>
    <div className="skeleton skeleton-text w-24 h-10 rounded-lg mt-4 inline-block"></div>
  </div>
);

export const TableRowSkeleton = () => (
  <tr className="table-row-hover">
    <td className="py-3 px-4">
      <div className="skeleton skeleton-text small w-20"></div>
    </td>
    <td className="py-3 px-4">
      <div className="skeleton skeleton-text small w-16"></div>
    </td>
    <td className="py-3 px-4">
      <div className="skeleton skeleton-text small w-12"></div>
    </td>
    <td className="py-3 px-4">
      <div className="skeleton skeleton-text small w-10"></div>
    </td>
    <td className="py-3 px-4">
      <div className="skeleton skeleton-text small w-14"></div>
    </td>
    <td className="py-3 px-4 text-right">
      <div className="skeleton skeleton-text small w-20 ml-auto"></div>
    </td>
    <td className="py-3 px-4 text-center">
      <div className="skeleton skeleton-text small w-8 mx-auto"></div>
    </td>
  </tr>
);
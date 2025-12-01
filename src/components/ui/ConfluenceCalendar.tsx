'use client';

import React, { useState, useMemo } from 'react';
import { useSidebarSync } from '@/hooks/useSidebarSync';
import { debounce } from '@/lib/performance';

interface CalendarEvent {
  id: string;
  date: string;
  title: string;
  type: 'trade' | 'strategy' | 'analysis';
  symbol?: string;
  pnl?: number;
  confidence?: number;
}

interface ConfluenceCalendarProps {
  events: CalendarEvent[];
  isLoading?: boolean;
}

const ConfluenceCalendar: React.FC<ConfluenceCalendarProps> = ({ events, isLoading = false }) => {
  const { isCollapsed, isTransitioning } = useSidebarSync();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Get days in month
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  };

  // Filter events for selected date
  const eventsForDate = useMemo(() => {
    if (!selectedDate) return [];
    
    return events.filter(event => {
      const eventDate = new Date(event.date);
      return (
        eventDate.getDate() === selectedDate.getDate() &&
        eventDate.getMonth() === selectedDate.getMonth() &&
        eventDate.getFullYear() === selectedDate.getFullYear()
      );
    });
  }, [events, selectedDate]);

  // Get events for a specific day
  const getEventsForDay = (day: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.date);
      return (
        eventDate.getDate() === day.getDate() &&
        eventDate.getMonth() === day.getMonth() &&
        eventDate.getFullYear() === day.getFullYear()
      );
    });
  };

  // Navigate months
  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  // Get event type color
  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'trade':
        return 'bg-[#B89B5E]';
      case 'strategy':
        return 'bg-[#4F5B4A]';
      case 'analysis':
        return 'bg-[#D6C7B2]';
      default:
        return 'bg-gray-500';
    }
  };

  // Get P&L color
  const getPnlColor = (pnl?: number) => {
    if (!pnl) return '';
    return pnl >= 0 ? 'text-[#B89B5E]' : 'text-[#A7352D]';
  };

  if (isLoading) {
    return (
      <div className="card-unified p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-700 rounded w-1/4"></div>
          <div className="h-64 bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  const days = getDaysInMonth(currentDate);
  const monthYear = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="card-unified p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-primary mb-4">Trading Calendar</h2>
        
        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigateMonth('prev')}
            className="p-2 hover:bg-background rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <h3 className="text-lg font-medium text-primary">{monthYear}</h3>
          
          <button
            onClick={() => navigateMonth('next')}
            className="p-2 hover:bg-background rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1 mb-6">
        {/* Day headers */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center text-sm font-medium text-tertiary py-2">
            {day}
          </div>
        ))}
        
        {/* Calendar days */}
        {days.map((day, index) => {
          if (!day) {
            return <div key={`empty-${index}`} className="aspect-square"></div>;
          }

          const dayEvents = getEventsForDay(day);
          const isSelected = selectedDate && 
            day.getDate() === selectedDate.getDate() &&
            day.getMonth() === selectedDate.getMonth() &&
            day.getFullYear() === selectedDate.getFullYear();

          const isToday = 
            day.getDate() === new Date().getDate() &&
            day.getMonth() === new Date().getMonth() &&
            day.getFullYear() === new Date().getFullYear();

          return (
            <button
              key={day.toISOString()}
              onClick={() => setSelectedDate(day)}
              className={`aspect-square p-1 border border-secondary rounded-lg transition-all hover:border-accent ${
                isSelected ? 'border-accent bg-accent/10' : ''
              } ${isToday ? 'bg-background/50' : ''}`}
            >
              <div className="text-sm text-primary mb-1">{day.getDate()}</div>
              <div className="space-y-1">
                {dayEvents.slice(0, 3).map((event, i) => (
                  <div
                    key={event.id}
                    className={`h-1 rounded-full ${getEventTypeColor(event.type)}`}
                    title={event.title}
                  ></div>
                ))}
                {dayEvents.length > 3 && (
                  <div className="text-xs text-tertiary">+{dayEvents.length - 3}</div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Date Events */}
      {selectedDate && (
        <div className="mt-6 pt-6 border-t border-secondary">
          <h3 className="text-lg font-medium text-primary mb-4">
            {selectedDate.toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </h3>
          
          {eventsForDate.length === 0 ? (
            <p className="text-tertiary">No events scheduled for this date</p>
          ) : (
            <div className="space-y-3">
              {eventsForDate.map(event => (
                <div key={event.id} className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${getEventTypeColor(event.type)}`}></div>
                    <div>
                      <div className="font-medium text-primary">{event.title}</div>
                      {event.symbol && (
                        <div className="text-sm text-tertiary">{event.symbol}</div>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    {event.pnl !== undefined && (
                      <div className={`font-medium ${getPnlColor(event.pnl)}`}>
                        {event.pnl >= 0 ? '+' : ''}{event.pnl.toFixed(2)}
                      </div>
                    )}
                    {event.confidence && (
                      <div className="text-sm text-tertiary">{event.confidence}%</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Summary Stats */}
      <div className="mt-6 pt-6 border-t border-secondary">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{events.length}</div>
            <div className="text-sm text-tertiary">Total Events</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-[#B89B5E]">
              {events.filter(e => e.type === 'trade').length}
            </div>
            <div className="text-sm text-tertiary">Trades</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-[#4F5B4A]">
              {events.filter(e => e.type === 'strategy').length}
            </div>
            <div className="text-sm text-tertiary">Strategies</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-[#D6C7B2]">
              {events.filter(e => e.type === 'analysis').length}
            </div>
            <div className="text-sm text-tertiary">Analysis</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfluenceCalendar;
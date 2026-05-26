import React from 'react';
import { History } from "lucide-react";

interface TimelineEvent {
  date: string;
  title: string;
  description: string;
}

interface CaseTimelineProps {
  events: TimelineEvent[];
}

export default function CaseTimeline({ events }: CaseTimelineProps) {
  return (
    <div className="space-y-4">
      <h4 className="text-sm font-bold text-navy-900 dark:text-white flex items-center gap-2 mb-4">
        <History size={16} className="text-primary-500" />
        المخطط الزمني
      </h4>
      <div className="relative border-s-2 border-slate-200 dark:border-white/10 ms-2 space-y-6 pb-2">
        {events.map((event, i) => (
          <div key={i} className="relative ps-6">
            <div className="absolute -start-[9px] top-1.5 w-4 h-4 rounded-full bg-white dark:bg-navy-900 border-2 border-primary-500" />
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold">{event.title}</span>
              <span className="text-[10px] text-slate-400 font-mono">{event.date}</span>
            </div>
            <p className="text-[10px] text-slate-500 leading-relaxed">{event.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

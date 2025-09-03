'use client';

import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface AccordionItem {
  id: string;
  question: string;
  answer: string;
}

interface AccordionProps {
  items: AccordionItem[];
  defaultOpen?: string[];
}

export function Accordion({ items, defaultOpen = [] }: AccordionProps) {
  const [openItems, setOpenItems] = useState<Set<string>>(new Set(defaultOpen));

  const toggleItem = (id: string) => {
    const newOpenItems = new Set(openItems);
    if (newOpenItems.has(id)) {
      newOpenItems.delete(id);
    } else {
      newOpenItems.add(id);
    }
    setOpenItems(newOpenItems);
  };

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div key={item.id} className="border border-border rounded-lg">
          <button
            onClick={() => toggleItem(item.id)}
            className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-surface/50 transition-colors"
            aria-expanded={openItems.has(item.id)}
          >
            <span className="font-medium text-heading">{item.question}</span>
            <ChevronDown
              className={`w-5 h-5 text-subtext transition-transform ${
                openItems.has(item.id) ? 'rotate-180' : ''
              }`}
            />
          </button>
          {openItems.has(item.id) && (
            <div className="px-6 pb-4">
              <div className="pt-2 border-t border-border">
                <p className="text-subtext leading-relaxed">{item.answer}</p>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

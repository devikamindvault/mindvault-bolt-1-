
import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import type { Transcription } from '@shared/schema';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';

export function DateSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const { data: transcriptions = [] } = useQuery<Transcription[]>({
  });

  const firstEntryDates = transcriptions.reduce((acc, t) => {
    if (!t.createdAt) return acc;
    const date = format(new Date(t.createdAt), 'dd/MM/yy');
    if (!acc.includes(date)) acc.push(date);
    return acc;
  }, [] as string[]).sort().reverse();

  return (
    <div className="relative h-full">
      <div
        className={`
          absolute right-0 top-0 h-full
          bg-card border-l border-border
          transition-all duration-300 ease-in-out
          ${isOpen ? 'w-[80px]' : 'w-0'}
          overflow-hidden
        `}
      >
        <div className="p-2 text-center text-xs font-medium text-muted-foreground border-b">
          Dates
        </div>
        <div className="p-2 space-y-1 overflow-y-auto" style={{ maxHeight: 'calc(100% - 6rem)' }}>
          {firstEntryDates.map((date, index) => (
            <Badge
              variant="outline"
              className="w-full justify-center text-center cursor-pointer px-2 py-1 hover:bg-accent"
            >
              {date}
            </Badge>
          ))}
        </div>
      </div>

      <Button
        variant="ghost"
        size="icon"
        className={`absolute bottom-4 right-[-12px] z-20 h-8 w-8 rounded-full bg-background shadow-md hover:bg-accent transition-transform ${isOpen ? 'rotate-180' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}

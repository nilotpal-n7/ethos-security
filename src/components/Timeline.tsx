"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { CreditCard, Wifi, Calendar, BookOpen, MessageSquare, Loader2, BrainCircuit, AlertTriangle } from "lucide-react";

// --- NEW Sub-Component: NoRecentActivityAlert ---
// Displays a critical alert at the top if the last known event is over 24 hours ago.
function NoRecentActivityAlert() {
    return (
        <div className="relative bg-red-900/50 border border-red-500/50 text-red-300 px-4 py-3 rounded-lg mb-8 flex items-center gap-4 z-1">
            <AlertTriangle className="h-5 w-5 text-red-400" />
            <div>
                <p className="font-bold">Critical Alert</p>
                <p className="text-sm">No activity detected in the last 24 hours.</p>
            </div>
        </div>
    );
}

// --- Sub-Component: Automated GapAnalyzer ---
// This component now automatically fetches its prediction when it appears on screen.
function GapAnalyzer({ gap, userId, isRightSide }: { gap: { start: string, end: string, duration: number, locationBefore: any, locationAfter: any }, userId: number, isRightSide: boolean }) {
    const [prediction, setPrediction] = useState<any>(null);
    const [reason, setReason] = useState("");
    const [isLoading, setIsLoading] = useState(true); // Start loading immediately

    useEffect(() => {
        const fetchPrediction = async () => {
            setIsLoading(true);
            try {
                const response = await fetch('/api/predict/location', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId, startTime: gap.start, endTime: gap.end, locationBefore: gap.locationBefore, locationAfter: gap.locationAfter }),
                });
                const data = await response.json();
                setPrediction(data.prediction);
                setReason(data.reason);
            } catch (error) {
                console.error("Prediction failed:", error);
                setReason("An error occurred while making a prediction.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchPrediction();
    }, [gap, userId]); // Run once when the component mounts with its props

    return (
        <motion.div
            className="relative flex items-center mb-12"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
        >
            {/* The Circle Icon on the Road (using the brain icon) */}
            <div className="absolute left-1/2 -translate-x-1/2 z-10 w-12 h-12 rounded-full flex items-center justify-center bg-cyan-500">
                {isLoading ? <Loader2 className="w-5 h-5 text-white animate-spin" /> : <BrainCircuit className="w-5 h-5 text-white" />}
            </div>

            {/* The Details Rectangle (styled like an event but with a dotted border) */}
            <motion.div
                className={`w-[calc(50%-2.5rem)] ${isRightSide ? "ml-[calc(50%+2.5rem)]" : "mr-[calc(50%+2.5rem)]"}`}
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300 }}
            >
                <div className={`relative w-fit bg-gray-800/80 backdrop-blur-sm border-2 border-dashed border-cyan-500/50 p-4 rounded-lg shadow-lg ${isRightSide ? "" : "ml-auto"}`}>
                    <div className={`absolute top-1/2 -translate-y-1/2 h-px w-6 bg-gray-700 ${isRightSide ? "-left-6" : "-right-6"}`}></div>
                    <p className={`font-semibold text-cyan-400 ${isRightSide ? "text-left" : "text-right"}`}>Predicted Location</p>
                    <p className={`text-gray-300 break-words ${isRightSide ? "text-left" : "text-right"}`}>{prediction?.name || "Analyzing..."}</p>
                    <p className={`text-sm text-gray-500 mt-1 ${isRightSide ? "text-left" : "text-right"}`}>
                        {isLoading ? "Based on historical data..." : reason}
                    </p>
                </div>
            </motion.div>
        </motion.div>
    );
}


// --- Sub-Component: MonthTrigger ---
function MonthTrigger({ dateString, onVisible }: { dateString: string; onVisible: (date: string) => void }) {
  const { ref, inView } = useInView({ threshold: 0.5 });
  useEffect(() => {
    if (inView) onVisible(dateString);
  }, [inView, dateString, onVisible]);
  return <div ref={ref} className="absolute h-px w-full top-1/2 -z-10"></div>;
}

// --- Main Timeline Component ---
type TimelineEvent = { type: string; timestamp: string; details: string; location: any };
const eventIcons: { [key: string]: React.ReactElement } = {
  "Card Swipe": <CreditCard className="w-5 h-5 text-white" />,
  "Wi-Fi Connection": <Wifi className="w-5 h-5 text-white" />,
  "Room Booking": <Calendar className="w-5 h-5 text-white" />,
  "Library Checkout": <BookOpen className="w-5 h-5 text-white" />,
  "Helpdesk Ticket": <MessageSquare className="w-5 h-5 text-white" />,
};
const iconColors: { [key: string]: string } = {
    "Card Swipe": "bg-blue-500", "Wi-Fi Connection": "bg-green-500", "Room Booking": "bg-purple-500", "Library Checkout": "bg-yellow-500", "Helpdesk Ticket": "bg-red-500",
};
type TimelineProps = { 
    userId: number; 
    onMonthChange: (dateString: string) => void;
    from?: string | null;
    to?: string | null;
};

export function Timeline({ userId, onMonthChange, from, to }: TimelineProps) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const { ref: loaderRef, inView: loaderInView } = useInView({ threshold: 1.0 });

  const loadMoreEvents = useCallback(async () => {
    if (isLoading || !hasMore) return;
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ page: page.toString() });
      if (from) params.append('from', from);
      if (to) params.append('to', to);

      const response = await fetch(`/api/timeline/${userId}?${params.toString()}`);
      const data = await response.json();
      if (data && Array.isArray(data.timeline)) {
        setEvents((prev) => [...prev, ...data.timeline]);
        setPage((prev) => prev + 1);
        if (data.timeline.length === 0) setHasMore(false);
      } else {
        setHasMore(false);
        if (data.error) console.error("API Error:", data.error);
      }
    } catch (error) {
      console.error("Failed to fetch timeline:", error);
      setHasMore(false);
    } finally {
      setIsLoading(false);
    }
  }, [page, userId, isLoading, hasMore, from, to]);

  useEffect(() => {
    if (loaderInView && hasMore && !isLoading) loadMoreEvents();
  }, [loaderInView, hasMore, isLoading, loadMoreEvents]);
  
  useEffect(() => {
    setEvents([]);
    setPage(0);
    setHasMore(true);
    setIsLoading(false);
    onMonthChange("");
  }, [userId, onMonthChange, from, to]);

  const timelineItems = useMemo(() => {
    const items: { type: 'event' | 'gap'; data: any }[] = [];
    const GAP_THRESHOLD_MINUTES = 60;
    const sortedEvents = [...events].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    for (let i = 0; i < sortedEvents.length; i++) {
        items.push({ type: 'event', data: sortedEvents[i] });
        if (i < sortedEvents.length - 1) {
            const eventBefore = sortedEvents[i];
            const eventAfter = sortedEvents[i + 1];
            const time1 = new Date(eventBefore.timestamp).getTime();
            const time2 = new Date(eventAfter.timestamp).getTime();
            const diffMinutes = (time2 - time1) / (1000 * 60);

            if (diffMinutes > GAP_THRESHOLD_MINUTES) {
                items.push({ 
                    type: 'gap', 
                    data: { 
                        start: eventBefore.timestamp, 
                        end: eventAfter.timestamp, 
                        duration: Math.round(diffMinutes),
                        locationBefore: eventBefore.location,
                        locationAfter: eventAfter.location
                    } 
                });
            }
        }
    }
    return items.reverse();
  }, [events]);

  // --- NEW: Memo hook to check for the top-level 24-hour alert ---
  const showNoRecentActivityAlert = useMemo(() => {
      if (isLoading || events.length === 0) {
          return false;
      }
      // The timelineItems are reversed, so the last item is the oldest from the current batch.
      // We need the absolute newest event from the 'events' state.
      const newestEvent = events.reduce((latest, current) => 
          new Date(current.timestamp) > new Date(latest.timestamp) ? current : latest
      );

      const now = new Date().getTime();
      const newestEventTime = new Date(newestEvent.timestamp).getTime();
      const diffHours = (now - newestEventTime) / (1000 * 60 * 60);
      
      return diffHours > 24;
  }, [events, isLoading]);
  
  const itemsByMonth = useMemo(() => {
    return timelineItems.reduce((acc, item) => {
      const date = new Date(item.data.timestamp || item.data.start);
      const monthYear = `${date.toLocaleString('default', { month: 'short' }).toUpperCase()} ${date.getFullYear()}`;
      if (!acc[monthYear]) acc[monthYear] = [];
      acc[monthYear].push(item);
      return acc;
    }, {} as Record<string, typeof timelineItems>);
  }, [timelineItems]);

  if (isLoading && events.length === 0) {
    return <div className="flex justify-center p-4"><Loader2 className="animate-spin text-gray-500" /></div>;
  }

  return (
    <div className="relative w-full max-w-4xl mx-auto px-4">
    {showNoRecentActivityAlert && <NoRecentActivityAlert />}
      <div className="absolute left-1/2 top-0 h-full w-0.5 bg-gray-700 -translate-x-1/2"></div>
      
      {Object.entries(itemsByMonth).map(([monthYear, monthItems]) => (
        <div key={monthYear} className="relative">
          <MonthTrigger dateString={monthYear} onVisible={onMonthChange} />
          {monthItems.map((item) => {
            const globalIndex = timelineItems.findIndex(i => (i.data.timestamp || i.data.start) === (item.data.timestamp || item.data.start));
            const isRightSide = globalIndex % 3 !== 0;

            if (item.type === 'gap') {
              return <GapAnalyzer key={`gap-${item.data.start}`} gap={item.data} userId={userId} isRightSide={isRightSide} />;
            }
            
            const event = item.data;
            return (
              <motion.div
                key={`${event.timestamp}-${globalIndex}`}
                className="relative flex items-center mb-12"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              >
                <div className={`absolute left-1/2 -translate-x-1/2 z-10 w-12 h-12 rounded-full flex items-center justify-center ${iconColors[event.type] || 'bg-gray-500'}`}>
                  {eventIcons[event.type]}
                </div>
                <motion.div
                  className={`w-[calc(50%-2.5rem)] ${isRightSide ? "ml-[calc(50%+2.5rem)]" : "mr-[calc(50%+2.5rem)]"}`}
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                    <div className={`relative w-fit bg-gray-800/80 backdrop-blur-sm border border-gray-700 p-4 rounded-lg shadow-lg ${isRightSide ? "" : "ml-auto"}`}>
                        <div className={`absolute top-1/2 -translate-y-1/2 h-px w-6 bg-gray-700 ${isRightSide ? "-left-6" : "-right-6"}`}></div>
                        <p className={`font-semibold text-white ${isRightSide ? "text-left" : "text-right"}`}>{event.type}</p>
                        <p className={`text-gray-300 break-words ${isRightSide ? "text-left" : "text-right"}`}>{event.details}</p>
                        <p className={`text-sm text-gray-500 mt-1 ${isRightSide ? "text-left" : "text-right"}`}>{new Date(event.timestamp).toLocaleString()}</p>
                    </div>
                </motion.div>
              </motion.div>
            );
          })}
        </div>
      ))}
      
      {isLoading && events.length > 0 && <div className="flex justify-center p-4"><Loader2 className="animate-spin text-gray-500" /></div>}
      <div ref={loaderRef} style={{ height: "1px" }} />
    </div>
  );
}

import { useState, useEffect, useRef } from 'react';
import { ConsumptionUpdate } from '../types/types';

// Custom hook to subscribe to SSE and return data for all para_ids
export const useWeightConsumption = (url: string) => {
  const [data, setData] = useState<Record<number, ConsumptionUpdate>>({}); // Store data for all para_ids
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    // Initialize EventSource
    console.log('Connecting to SSE endpoint...');
    const eventSource = new EventSource(url);
    eventSourceRef.current = eventSource;

    // Handle the custom event 'consumptionUpdate'
    const handleConsumptionUpdate = (event: MessageEvent) => {
      try {
        const parsedData: ConsumptionUpdate = JSON.parse(event.data);
        setData((prevData) => ({
          ...prevData,
          [parsedData.para_id]: parsedData,
        }));
      } catch (error) {
        console.error('Failed to parse SSE message:', error);
      }
    };

    eventSource.addEventListener('consumptionUpdate', handleConsumptionUpdate);

    // Handle errors
    eventSource.onerror = (error) => {
      console.error('SSE error:', error);
    };

    // Cleanup function
    return () => {
      console.log('Closing SSE connection.');
      if (eventSourceRef.current) {
        eventSourceRef.current.removeEventListener('consumptionUpdate', handleConsumptionUpdate);
        eventSourceRef.current.close();
      }
    };
  }, [url]); // Effect re-runs only if the SSE URL changes

  return data; // Return the accumulated data for all para_ids
};

export default useWeightConsumption;

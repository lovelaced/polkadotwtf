import { useState, useEffect, useRef } from 'react';
import { ConsumptionUpdate } from '../types/types';

export const useWeightConsumption = (url: string) => {
  const [data, setData] = useState<Record<string, { current: ConsumptionUpdate; prev: ConsumptionUpdate | null }>>({});

  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    console.log('Connecting to SSE endpoint...');
    const eventSource = new EventSource(url);
    eventSourceRef.current = eventSource;

    const handleConsumptionUpdate = (event: MessageEvent) => {
      try {
        const parsedData: ConsumptionUpdate = JSON.parse(event.data);
        const { para_id: paraId, block_number: currentBlock, relay } = parsedData;
        const key = `${relay}-${paraId}`; // Use relay and paraId together as the key

        setData((prevData) => {
          const existingEntry = prevData[key];
          const isDuplicate = existingEntry?.current?.block_number === currentBlock;

          if (isDuplicate) return prevData;

          return {
            ...prevData,
            [key]: {
              prev: existingEntry?.current || null,
              current: parsedData,
            },
          };
        });
      } catch (error) {
        console.error('Failed to parse SSE message:', error);
      }
    };

    eventSource.addEventListener('consumptionUpdate', handleConsumptionUpdate);

    eventSource.onerror = (error) => {
      console.error('SSE error:', error);
    };

    return () => {
      console.log('Closing SSE connection.');
      if (eventSourceRef.current) {
        eventSourceRef.current.removeEventListener('consumptionUpdate', handleConsumptionUpdate);
        eventSourceRef.current.close();
      }
    };
  }, [url]);

  return data;
};

export default useWeightConsumption;

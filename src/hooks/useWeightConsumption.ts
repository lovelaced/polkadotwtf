import { useState, useEffect, useRef } from 'react';

// Define the shape of the data you're receiving (e.g., WeightConsumption)
interface ConsumptionUpdate {
  para_id: number;
  ref_time: {
    normal: number;
    operational: number;
    mandatory: number;
  };
  proof_size: {
    normal: number;
    operational: number;
    mandatory: number;
  };
  total_proof_size: number;
}

// Custom hook to subscribe to WebSocket and return data for all para_ids
export const useWeightConsumption = (url: string, retryInterval = 5000) => {
  const [data, setData] = useState<Record<number, ConsumptionUpdate>>({}); // Store data for all para_ids
  const websocketRef = useRef<WebSocket | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isConnecting = useRef(false); // Track WebSocket connection state

  const connectWebSocket = () => {
    if (isConnecting.current) return; // Prevent multiple connection attempts
    console.log('Attempting to connect to WebSocket...');
    isConnecting.current = true;

    const websocket = new WebSocket(url);
    websocketRef.current = websocket;

    websocket.onopen = () => {
      console.log('WebSocket connection established.');
      isConnecting.current = false; // Connection established
    };

    // Handle WebSocket messages
    websocket.onmessage = (event) => {
      try {
        const parsedData: ConsumptionUpdate = JSON.parse(event.data);
        console.log('Received data:', parsedData);

        // Update state by merging the new data into the existing data
        setData((prevData) => ({
          ...prevData,
          [parsedData.para_id]: parsedData, // Update only the para_id received from WebSocket
        }));
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    // Handle WebSocket errors
    websocket.onerror = (error) => {
      console.error('WebSocket error:', error);
      isConnecting.current = false; // Reset the connection state
      reconnectWebSocket(); // Attempt to reconnect
    };

    // Handle WebSocket closure
    websocket.onclose = () => {
      console.log('WebSocket closed');
      isConnecting.current = false; // Reset the connection state
      reconnectWebSocket(); // Attempt to reconnect when the connection closes
    };
  };

  const reconnectWebSocket = () => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }

    // Add a slight delay before attempting to reconnect
    retryTimeoutRef.current = setTimeout(() => {
      console.log('Reconnecting to WebSocket...');
      connectWebSocket();
    }, retryInterval); // Retry connecting after a delay
  };

  useEffect(() => {
    // Initial WebSocket connection
    connectWebSocket();

    // Cleanup function
    return () => {
      if (websocketRef.current) {
        console.log('Closing WebSocket connection.');
        websocketRef.current.close();
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [url]); // Effect re-runs only if the WebSocket URL changes

  return data; // Return the accumulated data for all para_ids
};

export default useWeightConsumption;

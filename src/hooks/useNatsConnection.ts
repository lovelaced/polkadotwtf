// src/hooks/useNatsConnection.ts
import { useState, useEffect } from 'react';
import { connect, StringCodec } from 'https://cdn.jsdelivr.net/npm/nats.ws@1.10.0/esm/nats.js';
import { ChainMetrics, ChainName, chainNames } from '../types/chains';

const BLOCK_TIME = 6; // Block time in seconds

export const useNatsConnection = () => {
  const [tpsData, setTpsData] = useState<Record<ChainName, ChainMetrics>>(
    chainNames.reduce((acc, chain) => {
      acc[chain] = { tps: 0, block: 0, weight: 0, kbps: 0 };
      return acc;
    }, {} as Record<ChainName, ChainMetrics>)
  );

  const sc = new StringCodec();

  useEffect(() => {
    const setupNatsConnection = async () => {
      const nc = await connect({ servers: ['wss://dev.dotsentry.xyz/ws'] });

      const subscriptions = await Promise.all(
        chainNames.map((chain) => ({
          blockContentSub: nc.subscribe(`${chain}.*.*.*.Blocks.*.BlockContent`),
        }))
      );

      subscriptions.forEach(async (subObj: any, chainIndex: number) => {
        for await (const msg of subObj.blockContentSub) {
          const blockData = sc.decode(msg.data);
          const parsedData = JSON.parse(blockData);
          const chain = chainNames[chainIndex];

          const blockNumber = parsedData.number; // Extract the block number from the message
          const extrinsicsCount = parsedData.extrinsics.length;
          const tps = (extrinsicsCount / BLOCK_TIME).toFixed(2);
          const weight = Math.floor(Math.random() * 1000);
          const kbps = Math.random() * 10;

          setTpsData((prevData) => ({
            ...prevData,
            [chain]: {
              ...prevData[chain],
              block: blockNumber, // Update block number
              tps: parseFloat(tps),
              weight,
              kbps,
            },
          }));
        }
      });
    };

    setupNatsConnection();
  }, []);

  return tpsData;
};

export default useNatsConnection;

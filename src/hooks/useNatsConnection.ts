import { useState, useEffect } from 'react';
import { connect, StringCodec } from 'https://cdn.jsdelivr.net/npm/nats.ws@1.10.0/esm/nats.js';
import { ChainMetrics, ChainName, chainsConfig } from '../types/chains';
import { BLOCK_TIME } from '../constants';

export const useNatsConnection = () => {
  const [tpsData, setTpsData] = useState<Record<ChainName, ChainMetrics>>(
    Object.keys(chainsConfig).reduce((acc, chain) => {
      acc[chain as ChainName] = { tps: 0, block: 0, kbps: 0 };
      return acc;
    }, {} as Record<ChainName, ChainMetrics>)
  );

  const sc = new StringCodec();

  useEffect(() => {
    const setupNatsConnection = async () => {
      try {
        const nc = await connect({ servers: ['wss://dev.dotsentry.xyz/ws'] });
        const subscriptions = await Promise.all(
          Object.keys(chainsConfig).map((chain) => ({
            blockContentSub: nc.subscribe(`${chain}.Relay.${chain}.*.Blocks.*.BlockContent`),
            blockNumberSub: nc.subscribe(`${chain}.Relay.${chain}.*.Blocks.*.BlockNumber`),
          }))
        );

        console.log('Subscribed to chains:', Object.keys(chainsConfig));

        subscriptions.forEach((subObj: any) => {
          const handleMessage = async (msg: any, type: 'content' | 'number') => {
            const [chainName] = msg.subject.split('.');
            const chain = chainName as ChainName;

            if (type === 'content') {
              const blockData = sc.decode(msg.data);
              try {
                const parsedData = JSON.parse(blockData);
                const extrinsicsCount = parsedData.extrinsics.length;
                const tps = (extrinsicsCount / BLOCK_TIME).toFixed(2);

                setTpsData((prevData) => ({
                  ...prevData,
                  [chain]: {
                    ...prevData[chain],
                    tps: parseFloat(tps),
                  },
                }));
              } catch (parseError) {
                console.error(`Failed to parse block content for chain: ${chain}`, parseError);
              }
            } else if (type === 'number') {
              const blockNumber = parseInt(sc.decode(msg.data), 10);

              setTpsData((prevData) => ({
                ...prevData,
                [chain]: {
                  ...prevData[chain],
                  block: blockNumber,
                },
              }));
            }
          };

          // Handle block content (TPS calculation)
          (async () => {
            for await (const msg of subObj.blockContentSub) {
              await handleMessage(msg, 'content');
            }
          })();

          // Handle block number
          (async () => {
            for await (const msg of subObj.blockNumberSub) {
              await handleMessage(msg, 'number');
            }
          })();
        });
      } catch (connectionError) {
        console.error('Failed to establish NATS connection:', connectionError);
      }
    };

    setupNatsConnection();
  }, []);

  return tpsData;
};

export default useNatsConnection;

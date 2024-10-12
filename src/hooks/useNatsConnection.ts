import { useState, useEffect } from 'react';
import { connect, StringCodec } from 'https://cdn.jsdelivr.net/npm/nats.ws@1.10.0/esm/nats.js';
import { ChainMetrics, PolkadotChainName, KusamaChainName, polkadotChainsConfig, kusamaChainsConfig } from '../types/chains';
import { BLOCK_TIME } from '../constants';

type Relay = 'Polkadot' | 'Kusama'; // New type for relay selection

export const useNatsConnection = (relay: Relay) => {
  // Determine the correct chain configuration based on the relay selected
  const chainsConfig = relay === 'Polkadot' ? polkadotChainsConfig : kusamaChainsConfig;

  // Create the initial state based on the selected chains
  const [tpsData, setTpsData] = useState<Record<PolkadotChainName | KusamaChainName, ChainMetrics>>(
    Object.keys(chainsConfig).reduce((acc, chain) => {
      acc[chain as PolkadotChainName | KusamaChainName] = { tps: 0, block: 0, kbps: 0 };
      return acc;
    }, {} as Record<PolkadotChainName | KusamaChainName, ChainMetrics>)
  );

  const sc = new StringCodec();

  useEffect(() => {
    const setupNatsConnection = async () => {
      try {
        const nc = await connect({ servers: ['wss://dev.dotsentry.xyz/ws'] });

        // Loop through the dynamically selected chainsConfig
        const subscriptions = await Promise.all(
          Object.entries(chainsConfig).map(([chain, config]) => {
            let paraIdTemp = config.paraId; // Get paraId for the chain

            // Log the subscription string for debugging
            const blockNumberTopic = `${relay}.Relay.${chain}.${paraIdTemp}.Blocks.Finalized.BlockNumber`;
            console.log(`Subscribing to: ${blockNumberTopic}`);

            return {
              blockContentSub: nc.subscribe(`${relay}.Relay.${chain}.${paraIdTemp}.Blocks.Finalized.BlockContent`),
              blockNumberSub: nc.subscribe(`${relay}.Relay.${chain}.${paraIdTemp}.Blocks.Finalized.BlockNumber`),
            };
          })
        );

        subscriptions.forEach((subObj: any) => {
          const handleMessage = async (msg: any, type: 'content' | 'number') => {
            const [chainName] = msg.subject.split('.');
            const chain = chainName as PolkadotChainName | KusamaChainName;

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
                console.error("Failed to parse block content for chain:", chain, parseError);
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
  }, [relay]); // Re-run effect when relay changes

  return tpsData;
};

export default useNatsConnection;

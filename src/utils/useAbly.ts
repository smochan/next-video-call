
import { useState, useEffect } from 'react';
import * as Ably from 'ably';
import { AblyProvider, useChannel, usePresence } from 'ably/react';

const useAbly = (userId: string) => {
  const [isLoading, setIsLoading] = useState(true);
  const [ably, setAbly] = useState<any>(null);

  useEffect(() => {
    (async function createAblyAndJoinRoom() {
      try {
        const ably = new Ably.Realtime.Promise({ 
          key: process.env.NEXT_PUBLIC_API_KEY,
          clientId: userId
        });
        setAbly(ably);
        setIsLoading(false);

        console.log('connected to ably');

        // ably.connection.on('connected', () => {
        //   console.log('connected to ably');
        //   setMyClientId(ably.auth.clientId);
        // });

        ably.connection.on('failed', (e) => console.log('Failed to setup ably connection', e));
      } catch (e) {
        console.log("error", e);
      }
    })();
  }, []);

  async function subscribeChannel(channelName: string) {
    const {channel} = useChannel(channelName, (message) => {
      console.log("new message received: ", message);
    })
    return channel;
  }

  return {
    client: ably,
    isAblyReady: !isLoading,
    subscribeChannel : subscribeChannel
  };
};

export default useAbly;
import { useContext, useEffect, useState } from 'react';
/**
 * Creates a peer and joins them into the room
 * @returns peer object, its id and meta-state whether is peer fully created
 */
const usePeer = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [peer, setPeer] = useState<any>(null);
  const [myPeerId, setMyPeerId] = useState('');

  useEffect(() => {
    (async function createPeerAndJoinRoom() {
      try {
        const peer = new (await import('peerjs')).default();
        setPeer(peer);
        setIsLoading(false);

        peer.on('open', (id) => {
          console.log('your peer id = ', id);
          setMyPeerId(id);
        });

        peer.on('error', (e) => console.log('Failed to setup peer connection', e));
      } catch (e) {
        console.log("error", e);
      }
    })();
  }, []);

  return {
    peer,
    myPeerId,
    isPeerReady: !isLoading,
  };
};

export default usePeer;

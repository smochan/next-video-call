import Peer from "peerjs";
// const peer = new Peer();

let peer:any;
if (typeof window !== undefined && typeof Peer !== undefined) {
  peer = new Peer();

  
}
export default peer;

// const peerConnect = peer.on("open", (id: string) => {
//   console.log("My peer ID is: " + id);
//   return id;
// });
// const getVideo = async () => {
//   const stream = await navigator.mediaDevices.getUserMedia({
//     audio: true,
//     video: true,
//   });
//   return stream;
// }


// export {peer, peerConnect, getVideo};
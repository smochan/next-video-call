"use client"

import React, { useState, useEffect} from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import styles from "../../styles/Room.module.css";

import { v4 as uuidv4 } from "uuid";
import { io } from "socket.io-client";

import usePeer from '../../utils/usePeer';
// import Peer from "peerjs";
// import peer from '../../utils/peer'

const Room = () => {
  const router = useRouter();
  const roomId = "abcdef" as string; 
  const [userId, setUserId] = useState(uuidv4());
  const { peer, myPeerId, isPeerReady } = usePeer();
  // console.log("MY PEER ID", myPeerId)

  const [streams, setStreams] = useState<Array<{stream: MediaStream, userId: string}>>([]);
  const [socketState, setSocket] = useState<any>();
  const [msg, setMsg] = useState<string>("");
  const [exchangedMsg, setExchangedMsg] = useState<Array<{userId: string, msg: string}>>([]);


  const handleSelfStream = (device: string, otherUserId?: string) => {
    // console.log("mic")
    const videoElement = otherUserId? document.getElementById(otherUserId) as HTMLVideoElement :document.getElementById(userId) as HTMLVideoElement;
    
    if (videoElement && streams) {
      if(device === "mic") {
        videoElement.muted = !videoElement.muted;
        return;
      }
      if(device === "camera") {
        if(videoElement.srcObject == null){
          videoElement.srcObject = otherUserId? streams[streams.findIndex(e => e.userId == otherUserId)]?.stream: streams[0].stream;
          videoElement.play();
        }
        else{
          videoElement.srcObject = null;
          const data = {"roomId": roomId,"userId": userId, "myPeerId": myPeerId};
          socketState.emit("camera-off", data);
        }
      }
    }
  }
  const handleMsg = () => {
    // console.log("msg", mesg, userId)
    // sndMessage();
    const data = {roomId: roomId, userId: userId, message: msg};
    socketState.emit("message", data)
    setExchangedMsg(prev => [...prev, {userId: userId, msg: msg}])
  }

  const handleStreams = (stream: MediaStream, otherUserId: string) => {
    // console.log("handleStreams, otherUserId: ", otherUserId);
    const findIndex = streams.find(s => {
      console.log("s.userId: ", s.userId);
      s.userId === otherUserId
    });
    console.log("findIndex: ", findIndex);
    if (findIndex === undefined) {
      setStreams(prev => [...prev, {stream: stream, userId: otherUserId}]);
    }
  }


  useEffect(() => {
    const getOwnVideo = async () => {
      if (typeof window !== 'undefined' && window.navigator && window.navigator.mediaDevices && window.navigator.mediaDevices.getUserMedia) {
        const stream = await window.navigator.mediaDevices.getUserMedia({
          audio: true,
          video: true,
        });
        setStreams([{stream: stream, userId: userId}]);
      } else {
        console.log("getUserMedia is not supported");
      }
    }
    getOwnVideo();
  }, [])

  useEffect(() => {
    const PORT = 8080;
    const socketClient = () => {
    const socket = io(`:${PORT + 1}`, { path: "/api/socket", addTrailingSlash: false })

    streams && socket.on("connect", () => {
      if(isPeerReady) {
        peer.on("call", (call: any) => {
          call.answer(streams[0].stream);
          
          call.on("stream", (userVideoStream: MediaStream) => {
            console.log("getting calll.......")
            handleStreams(userVideoStream, call.metadata.userId);
          })
        })
        
        const data = {"roomId": roomId,"userId": userId, "myPeerId": myPeerId};
        console.log("data", data);
        socket.emit("join-room", data)
      }
    })

    socket.on("disconnect", () => {
      console.log("Disconnected")
    })

    streams && socket.on("user-connected", (data) => {
      // console.log("user-connected", data.myPeerId)
      if (data.userId !== userId) {
        console.log("new user-connected, peerId =", data.myPeerId)
        
        if(isPeerReady) {
          console.log("calling.....")
          var call = peer.call(data.myPeerId, streams[0].stream, {metadata: {userId: userId}});
          // console.log("call", call)
          call.on("stream", (userVideoStream: any) => {
            handleStreams(userVideoStream, data.userId);
            // setStreams(prev => [...prev, {stream: userVideoStream, userId: data.userId}]);
            // console.log("stream length", streams.length)
          })
        }
        
      }
    })

      socket.on("new-message", (data) => {
        // console.log("message: ", message, "from: ", senderId, "user id: ", userId)
        if (data.userId !== userId) {
          // console.log("new message", data.message, data.userId)

          setExchangedMsg(prev => [...prev, {userId: data.userId, msg: data.message}])
          // if peer.call()
        }
      })

      socket.on("camera-off", (data) => {
        if(data.userId!== userId) {
          // console.log("camera-off", data)
          handleSelfStream("camera", data.userId);
          // const videoElement = document.getElementById(data.userId) as HTMLVideoElement;
        }
      })
      socket.on("connect_error", async err => {
        // console.log(`connect_error due to ${err.message}`)
        await fetch("/api/socket")
      })

      return socket
    }
    const socket = socketClient();
    setSocket(socket);
  }, [myPeerId])


  return (
    <>
      <div className={styles.header}>
          <h3>Video Chat</h3>
      </div>
      <div className={styles.main}>
        <div className={styles.main__left}>
          <div className={styles.videos__group}>
            <div className={styles.video_grid}>
              { streams && streams.length ? streams.map((stream, index) => 
                index%2 == 0 ? <video  id={stream.userId} key={index} className={styles.video} muted autoPlay ref={(videoRef) => {
                  if (videoRef) {
                    videoRef.srcObject = stream.stream;
                  }
                }} />: ""

              ) : <p>no stream</p>

              }
            </div>
          </div>
          <div className={styles.options}>
            <div className={styles.options__left}>
              <div className={styles.options__button} onClick={() => handleSelfStream("camera")}>
                <i className="fa fa-video-camera" aria-hidden="true">
                  cam
                </i>
              </div>
              <div className={styles.options__button } onClick={() => handleSelfStream("mic")}>
                {/* <i className="fa fa-microphone" aria-hidden="true"> */}
                  mic
                {/* </i> */}
              </div>
            </div>
            <div className={styles.options__right}>
              <div
                className={
                  styles.options__button + " " + styles.background__red
                }
              >
                <i className="fa fa-phone" aria-hidden="true">
                  end
                </i>
              </div>
            </div>
          </div>
        </div>
        <div className={styles.main__right}>
          <div className={styles.main__chat_window}>
            {exchangedMsg && exchangedMsg.length? exchangedMsg.map((msg, index) => (
              <ul className={styles.messages} key={index}>{msg.msg} <span> : {msg.userId}</span></ul>
              
            )) : <p>no message</p>
            }
            {/* <ul className={styles.messages}></ul> */}
          </div>
          <div className={styles.main__message_container}>
            <input
              id="chat_message"
              type="text"
              placeholder="Type message here..."
              value={msg}
              onChange={(e) => 
              setMsg(e.target.value)
              // console.log(e.target.value)  
              }
            />
            <div className={styles.options__button} onClick={() => handleMsg()}>
              <i className="fa fa-plus" aria-hidden="true">
                send
              </i>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

// export default Room;
export default dynamic(() => Promise.resolve(Room), { ssr: false })

'use client'

import React, { useEffect, useState, useRef } from 'react'
import * as Ably from 'ably';
import { AblyProvider, useChannel} from 'ably/react';
import usePeer from '../utils/usePeer';

import styles from '@@/styles/Room.module.css'
import { v4 as uuidv4 } from "uuid";

const ChatRoom = () =>{

  const userId = uuidv4();

  const client = new Ably.Realtime.Promise({
    key: process.env.NEXT_PUBLIC_API_KEY,
    clientId: userId,
  })

  return(
    <AblyProvider client={client}>
      <ChatRoomClient userId={userId}/>
    </AblyProvider>
  )
}

const ChatRoomClient = (props: {userId: string}) => {
  const userId = props.userId;
  const [streams, setStreams] = useState<Array<{stream: MediaStream, peerId: string}>>([]);
  const [chats, setChats] = useState<Array<{message: string, name: string, id: string}>>([]);
  const [name, setName] = useState<{saved: boolean, name: string}>({saved: false, name: ""});

  const nameRef = useRef<HTMLInputElement>(null);
  const msgRef = useRef<HTMLInputElement>(null);

  const { peer, myPeerId, isPeerReady } = usePeer();

  const { channel } = useChannel('global-chat', (data) => {
    console.log("new message received: ", data.data, " clientId: ", data.clientId, "stream length: ", streams.length);
    const action = data.data.action;
      if(action === 'send-message') setChats(prev => [...prev, {message: data.data.message, name: data.data.name, id: data.clientId}])
      if(action === 'join-room' && isPeerReady && data.data.peerId!== myPeerId) {
        const call = peer.call(data.data.peerId, streams[0]?.stream, {metadata: {peerId: myPeerId}});
        call.on("stream", (userVideoStream: MediaStream) => {
          console.log("making call.....")
          setStreams(prev => [...prev, {stream: userVideoStream, peerId: data.data.peerId}]);
        })
      }
  })



  const handleSelfStream = (device: string) => {
      const videoElement = document.getElementById(userId) as HTMLVideoElement;
      if (videoElement) {
        if(device === "mic") {
          videoElement.muted = !videoElement.muted;
          return;
        }
        if(device === "camera") {
          if(videoElement.srcObject == null){
            videoElement.srcObject = streams[0].stream;
            videoElement.play();
          }
          else{
            videoElement.srcObject = null;
          }
        }
    }
  }


  useEffect(() => {
    const getOwnVideo = async () => {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });
      setStreams([{stream: stream, peerId: myPeerId}]);
    }

    if(isPeerReady && myPeerId !== '') {
      getOwnVideo();
      channel.publish('global-chat', { action: "join-room", name: name.name, peerId: myPeerId });
    }

  }, [isPeerReady, myPeerId]);

  const makePeerConnection = () => {
    if(isPeerReady) {

    console.log("Set to receive call")
      peer.on("call", (call: any) => {
        console.log("getting calll.......", streams.length);
        call.answer(streams[0]?.stream);
        
        call.on("stream", (userVideoStream: MediaStream) => {
          console.log("setting call")
          // handleStreams(userVideoStream, call.metadata.userId);
          setStreams(prev => [...prev, {stream: userVideoStream, peerId: call.metadata.peerId}]);
        })
      })
      // console.log("inside if");
    }
}

  useEffect(() => {
    console.log("isPeerReady", isPeerReady);
    if( streams && streams.length === 1 ) makePeerConnection();

  }, [isPeerReady, streams])

  return (
    <>
        <div className={styles.main__left}>
          <div className={styles.videos__group}>
            <div className={styles.video_grid}>
              { streams.length ? streams.map((stream, index) => (
                index%2 == 0 ? <video  id={stream.peerId} key={index} className={styles.video} muted autoPlay ref={(videoRef) => {
                  if (videoRef) {
                    videoRef.srcObject = stream.stream;
                  }
                }} /> : ""
              )) : <p>no stream</p>
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

              {name.saved ? 
              <p> Hey, {name.name}</p>
              : 
              <div className={styles.main__message_container}>
                <input
                  id="chat_message"
                  type="text"
                  placeholder="Add Name"
                  // onChange={(e) => setName({saved: false, name: e.target.value})}
                  ref={nameRef}
                  // value={name.name}
                />
                <div className={styles.options__button} onClick={() => nameRef.current?.value && setName({saved: true, name: nameRef.current.value})}>
                  <i className="fa fa-plus" aria-hidden="true">
                    Save
                  </i>
                </div>
              </div>
              }
            </div>
          </div>
        </div>
        <div className={styles.main__right}>
          <h1>Global Chat</h1>
          <div className={styles.main__chat_window}>
            {chats.length && chats.map((msg, index) => (
                <ul className={styles.messages} key={index}>{msg.message} : {msg.name}</ul>
              )) 
            }
          </div>
          <div className={styles.main__message_container}>
            <input
              id="chat_message"
              type="text"
              placeholder="Enter your message"
              // onChange={(e) => setMsg(e.target.value)}
              ref={msgRef}
            />
            { channel !== undefined && <div className={styles.options__button} onClick={() => msgRef.current?.value && channel.publish('global-chat', {message: msgRef.current.value, action: "send-message", name: name.saved ? name.name : "No-name"})}>
              <i className="fa fa-plus" aria-hidden="true">
                send
              </i>
            </div>
            }
          </div>
        </div>
    </ >
  )
}

export default ChatRoom;
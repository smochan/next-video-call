'use client'

import React, { useEffect, useState } from 'react'
import * as Ably from 'ably';
import { AblyProvider, useChannel, usePresence } from 'ably/react';
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
  const [streams, setStreams] = useState<MediaStream[]>([]);
  const [msg, setMsg] = useState<string>("");
  const [chats, setChats] = useState<Array<{message: string, name: string, id: string}>>([]);
  const [name, setName] = useState<{saved: boolean, name: string}>({saved: false, name: ""});

  const { channel } = useChannel('new-message', (data) => {
    console.log("new message received: ", data.data, " clientId: ", data.clientId);
      setChats(prev => [...prev, {message: data.data.message, name: data.data.name, id: data.clientId}])
  })


  const { peer, myPeerId, isPeerReady } = usePeer();

  const handleSelfStream = (device: string) => {
      const videoElement = document.getElementById(userId) as HTMLVideoElement;
      if (videoElement) {
        if(device === "mic") {
          videoElement.muted = !videoElement.muted;
          return;
        }
        if(device === "camera") {
          if(videoElement.srcObject == null){
            videoElement.srcObject = streams[0];
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
      setStreams([stream]);
    }
    getOwnVideo();

  }, []);

  // useEffect(() => {
  //   if(isPeerReady){
  //     peer.on("call", (call: any) => {
  //       call.answer(streams[0]);
        
  //       call.on("stream", (userVideoStream: MediaStream) => {
  //         console.log("getting calll.......")
  //         // handleStreams(userVideoStream, call.metadata.userId);
  //         setStreams(prev => [...prev, userVideoStream]);
  //       })
  //     })
  //   }

  // }, [isPeerReady]);

  return (
    <>
        <div className={styles.main__left}>
          <div className={styles.videos__group}>
            <div className={styles.video_grid}>
              { streams.length ? streams.map((stream, index) => (
                <video  id={userId} key={index} className={styles.video} muted autoPlay ref={(videoRef) => {
                  if (videoRef) {
                    videoRef.srcObject = stream;
                  }
                }} />
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
                  onChange={(e) => setName({saved: false, name: e.target.value})}
                  value={name.name}
                />
                <div className={styles.options__button} onClick={() => setName({saved: true, name: name.name})}>
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
              <ul className={styles.messages} key={index}>{msg.message} <span> : {msg.name}</span></ul>
            )) 
          }

            <ul className={styles.messages}></ul>
          </div>
          <div className={styles.main__message_container}>
            <input
              id="chat_message"
              type="text"
              placeholder="Enter your message"
              onChange={(e) => setMsg(e.target.value)}
            />
            <div className={styles.options__button} onClick={() => channel.publish('new-message', {message: msg, name: name.saved ? name.name : "No-name"})}>
              <i className="fa fa-plus" aria-hidden="true">
                send
              </i>
            </div>
          </div>
        </div>
    </ >
  )
}

export default ChatRoom;
const handleUserLeft = (streams: {stream: MediaStream, peerId: string, userId: string, mic: boolean, camera: boolean}[], presenceData: any, userId: string) => {
  console.log("inside findMissingStreamUserId")
  let arr: Array<number> = [];

  let arr2= [];
  for(let i = 0; i < presenceData.length; i++) {

    const index = streams.findIndex((stream) => stream.userId === presenceData[i].clientId);
    arr.push(index);

    console.log("index: ", index, presenceData[i].clientId);
  }

  for(let i = 0; i < arr.length; i++) {
    arr2.push(streams[arr[i]]);
  }
  return arr2;
} 

  export default handleUserLeft;
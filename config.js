// export json of config
exports.config = function(){
  data = {
    // edit below here
    music_dir: "/Users/johnathanlee/nodeMusic/node-music-player/mp3"
    // and above here
  }
  if(data.music_dir.lastIndexOf("/") == data.music_dir.length-1){
    data.music_dir = data.music_dir.substr(0, data.music_dir.length-1);
  }
  return data;
}
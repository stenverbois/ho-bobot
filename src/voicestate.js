const Thumbnail = require('./thumbnail');
const Provider = require('./provider');
const Collection = require('./collection');

module.exports =
class VoiceState {
    constructor(data) {
        this.channel_id = data.channel_id;
        console.log(this.channel_id )
        this.session_id = data.session_id;
        this.deaf = data.deaf;
        this.mute = data.mute;
        this.self_deaf = data.self_deaf;
        this.self_mute = data.self_mute;
        this.suppress = data.suppress;
    }
};

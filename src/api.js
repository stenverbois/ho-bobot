const BASE = "https://discordapp.com/api";

const EndPoints = {
    // Channels
    CHANNEL: id => `${BASE}/channels/${id}`,
    CHANNEL_MESSAGE: id => `${BASE}/channels/${id}/messages`,
    CHANNEL_MESSAGE_EDIT: (id, msg_id) => `${BASE}/channels/${id}/messages/${msg_id}`,
    CHANNEL_MESSAGE_BULK_DELETE: id => `${BASE}/channels/${id}/messages/bulk\_delete`,
    CHANNEL_MESSAGE_ACK: (id, msg_id) => `${BASE}/channels/${id}/messages/${msg_id}`,
    CHANNEL_PERMISSIONS: (id, overwrite_id) => `${BASE}/channels/${id}/permissions/${overwrite_id}`,
    CHANNEL_INVITES: id => `${BASE}/channels/${id}/invites`,
    CHANNEL_TYPING: id => `${BASE}/channels/${id}/typing`,

    // Guilds
    GUILD_CREATE: () => `${BASE}/guilds`,
    GUILD: id => `${BASE}/guilds/${id}`,
    GUILD_CHANNELS: id => `${BASE}/guilds/${id}/channels`,
    GUILD_MEMBERS: (id, user_id="") => `${BASE}/guilds/${id}/members/${user_id}`,
    GUILD_BANS: (id, user_id="") => `${BASE}/guilds/${id}/bans/${user_id}`,
    GUILD_ROLES: (id, role_id="") => `${BASE}/guilds/${id}/roles/${role_id}`,
    GUILD_PRUNE: id => `${BASE}/guilds/${id}/prune`,
    GUILD_REGIONS: id => `${BASE}/guilds/${id}/regions`,
    GUILD_INVITES: id => `${BASE}/guilds/${id}/invites`,
    GUILD_INTEGRATIONS: (id, integration_id="") => `${BASE}/guilds/${id}/integrations/${integration_id}`,
    GUILD_INTEGRATION_SYNC: (id, integration_id="") => `${BASE}/guilds/${id}/integrations/${integration_id}/sync`,
    GUILD_EMBED: id => `${BASE}/guilds/${id}/embed`,

    // Users
    USERS: () => `${BASE}/users`,
    USER: id => `${BASE}/users/${id}`,
    USER_GUILDS: (id, guild_id="") => `${BASE}/users/${id}/guilds/${guild_id}`,
    USER_CHANNELS: id => `${BASE}/users/${id}/channels`,
    USER_CONNECTIONS: id => `${BASE}/users/${id}/connections`,

    // Invites
    INVITE: id => `${BASE}/invites/${id}`,

    // Voice
    VOICE_REGIONS: () => `${BASE}/voice/regions`
};

module.exports = {EndPoints};

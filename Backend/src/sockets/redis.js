const { createClient } = require('redis');
const { createAdapter } = require('@socket.io/redis-adapter');

let pubClient, subClient;

const initRedisAdapter = async (io) => {
  // pubClient = createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' });
  // subClient = pubClient.duplicate();

  // await Promise.all([pubClient.connect(), subClient.connect()]);

  // io.adapter(createAdapter(pubClient, subClient));
  // console.log('Redis adapter attached to Socket.IO');

  return { pubClient, subClient };
};

const getPubClient = () => pubClient;
const getSubClient = () => subClient;

module.exports = { initRedisAdapter, getPubClient, getSubClient };
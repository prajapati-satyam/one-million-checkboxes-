const express = require('express')
const app = express()
const port = process.env.PORT || 3002;
const {Server} = require('socket.io');
const http = require('http');
const Redis = require('ioredis');
const httpSever = http.createServer(app);
const io = new Server(httpSever);

app.use(express.static('public'))

const redis = new Redis({
  hostname: "valkey",
  port: 6379
});
const pub = new Redis({
  hostname: "valkey",
  port: 6379
});
const sub = new Redis({
  hostname: "valkey",
  port: 6379
});


// setting state if it is null
try {

async function setState(params) {
await redis.set('state', JSON.stringify(Array(50000).fill(false)));
}
setState()

} catch(err) {
  console.log('ubable to set state : ', err)
}


app.get('/', (req, res) => {
  res.send('Hello World!')
})


// subscribe the channel


try {
  async function subscribe_channel() {
  await sub.subscribe('server:broker');
  sub.on('message', (channel, message) => {
    // const message_json = JSON.
    io.emit('server-update', JSON.parse(message))
  })
  }
  subscribe_channel();
} catch (err) {
 console.log("error in subscribe : " , err);
}

// const state = Array(50000).fill(false);
io.on('connection', (socket) => {
    console.log(`New socket connected : `, socket.id);
    socket.on('client-update', async (data) => {
      await pub.publish('server:broker', JSON.stringify(data));
      const redis_state = await redis.get('state');
      const redish_state_normal = JSON.parse(redis_state);
      redish_state_normal[data.index] = data.value;
      const redis_state_stringify = JSON.stringify(redish_state_normal)
      await redis.set('state', redis_state_stringify);
      io.emit('server-update', data)
    })
})

app.get('/state', async (req,res) => {
  const state = await redis.get('state');
  const state_normal = JSON.parse(state)
  return res.json({state_normal});
})

httpSever.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
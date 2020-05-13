const express = require("express");
const app = express();

const path = require("path");
// const logger = require('./server/logger')
// const microphoneStream = require('./translate')
// const translate = require('./translate')
// const stt = require('./stt')
// const tts = require('./tts')

var bodyParser = require("body-parser");
app.use(bodyParser.json());

// app.post('/translate', bodyParser.json(), function(req, res) {
//   const text = req.body.text
//   const target = req.body.target
//   translate.getTranslate(text, target).then(value => {
//     res.send(value)
//   })
// })

// app.post('/stt', bodyParser.json(), function(req, res) {
//   // console.log(req.body.file)
//   // const text = req.body.text
//   // const target = req.body.target
//   stt.getStt(req.body.file, req.body.lang, req.body.rateHertz).then(value => {
//     console.log(req.body.lang, '::', value)
//     res.send(value)
//   })
// })

// app.post('/tts', bodyParser.json(), function(req, res) {
//   tts.getTts(req.body.message, req.body.lang).then(value => {
//     // console.log(req.body.message, '::', value)
//     res.send(value)
//   })
// })

app.use(express.static(path.join(__dirname, "dist")));

const port = 8080;
const server = app.listen(port, () =>
  console.log(`Example app listening at http://localhost:${port}`)
);
const io = require("socket.io")(server);
io.on("connection", function(socket) {
  console.log("connect");
  var instanceId = socket.id;
  socket.on("msg", function(data) {
    console.log(data);
    socket.emit("recMsg", { comment: instanceId + ":" + data.comment + "\n" });
  });
});

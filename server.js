const express = require("express");
const app = express();
const path = require("path");
const process = require("process");
let buffer = [];

var bodyParser = require("body-parser");

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "dist")));

const port = 8080;
const server = app.listen(port, () =>
  console.log(`Example app listening at http://localhost:${port}`)
);

const createCsvWriter = require("csv-writer").createObjectCsvWriter;
const csvWriter = createCsvWriter({
  path: "file.csv",
  header: [
    { id: "chunkNum", title: "chunkNumber" },
    { id: "user", title: "cpu-user" },
    { id: "system", title: "cpu-system" },
    { id: "rss", title: "memory-rss" },
    { id: "heapTotal", title: "memory-heapTotal" },
    { id: "heapUsed", title: "memory-heapUsed" },
    { id: "external", title: "memory-external" },
  ],
});

const io = require("socket.io")(server);
io.on("connection", function(socket) {
  console.log("connect");
  var instanceId = socket.id;

  socket.on("msg", function(data) {
    console.log(data);
    socket.emit("recMsg", { comment: instanceId + ":" + data.comment + "\n" });
  });

  socket.on("media_chunk", function(data) {
    buffer.push(data.chunk);

    if (data.isEnd) {
      socket.emit("recMedia", { media: Buffer.concat(buffer) });
      buffer = [];
    }

    console.log("chunk count", buffer.length);
    // console.log(process.cpuUsage());
    // console.log(process.memoryUsage());
    const cpu = process.cpuUsage();
    const memory = process.memoryUsage();

    csvWriter
      .writeRecords([{
        chunkNum: buffer.length,
        user:cpu.user,
        system:cpu.system,
        rss:memory.rss,
        heapTotal:memory.heapTotal,
        heapUsed:memory.heapUsed,
        external:memory.external
      }]) // returns a promise
      .then(() => {
        
      });
  });
});

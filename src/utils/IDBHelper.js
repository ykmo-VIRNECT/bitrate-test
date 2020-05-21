import Dexie from "dexie";

const db = new Dexie("MediaChunk");

function initIDB() {
  console.log("init");
  db.version(1).stores({
    mediaChunk: "++id, uuid, chunkNumber, filename, blob",
  });
  console.log(db);
}

async function addMediaChunk(uuid, chunkNumber, fileName, blob) {
  await db.mediaChunk.add({
    uuid: uuid,
    chunkNumber: chunkNumber,
    fileName: fileName,
    blob: blob,
  });
}

async function getMediaChunkArray(uuid) {
  console.log(uuid)
  return await db.mediaChunk
    .where("uuid")
    .equals(uuid)
    .toArray()
}

const IDBHelper = {
  initIDB: initIDB,
  addMediaChunk: addMediaChunk,
  getMediaChunkArray: getMediaChunkArray,
};

export default IDBHelper;

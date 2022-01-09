import { IncomingMessage, ServerResponse } from "http";
import path from "path";
import fs from "fs";

const calderaRootDir = path.resolve(__dirname, "..", "public");

const serve = (
  req: IncomingMessage,
  res: ServerResponse,
  onError: (err: any) => void,
  options: { rootDir?: string; } = {}
) => {
  let rootDir = (options.rootDir ? options.rootDir : calderaRootDir);
  const url = req.url;
  let filePath = url
  let mimeType = "text/plain";

  if (url === "/") {
    filePath = "index.html";
    mimeType = "text/html";
    rootDir = calderaRootDir;
  } else if (url === "/caldera-client.js") {
    filePath = url.slice(1);
    mimeType = "application/javascript";
    rootDir = calderaRootDir;
  }
  if(url.endsWith('.css')) {
    mimeType = "text/css"
  }

  fs.readFile(path.join(rootDir, filePath), (err, buf) => {
    if (err) {
      onError(err);
    } else {
      res.setHeader("Content-Type", mimeType);
      res.end(buf);
    }
  });
};

export default serve;

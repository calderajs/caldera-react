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

  let filePath = "index.html";
  let mimeType = "text/html";

  if (url === "/caldera-client.js") {
    filePath = url.slice(1);
    rootDir = calderaRootDir;
    mimeType = "application/javascript";
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

import cookie from "cookie";
import finalhandler from "finalhandler";
import http, { IncomingMessage } from "http";
import nanoid from "nanoid";
import React from "react";
import { Nominal } from "simplytyped";
import WebSocket from "ws";
import { readRPCEvent } from "../rpc/decoder";
import { writeRPCMessages } from "../rpc/encoder";
import {
  CalderaRPCEvent,
  CalderaRPCMessage,
  CALDERA_SESSION_TOKEN_COOKIE
} from "../rpc/messages";
import CalderaContainer from "./CalderaContainer";
import createRenderer from "./calderaRenderer";
import { makeDispatcher } from "./dispatcher";
import serve from "./serve";

export * from "./head";
export * from "./listener";

export type SessionID = Nominal<string, "SessionID">;
export type Dispatch = (
  session: SessionID,
  msg: CalderaRPCMessage,
  skipQueue?: boolean
) => void;

export const renderCalderaApp = (
  app: React.ReactElement,
  options: { port?: number; hostname?: string } = {}
) => {
  const savedStates = new Map<SessionID, Buffer>();
  const server = http.createServer((req, res) =>
    serve(req, res, finalhandler(req, res))
  );
  const wss = new WebSocket.Server({
    noServer: true,
    // Supposedly dangerous, but let's see how it fares for our workflow
    perMessageDeflate: {
      zlibDeflateOptions: {
        // See zlib defaults.
        chunkSize: 1024,
        memLevel: 7,
        level: 3
      },
      zlibInflateOptions: {
        chunkSize: 10 * 1024
      },
      // Other options settable:
      clientNoContextTakeover: true, // Defaults to negotiated value.
      serverNoContextTakeover: true, // Defaults to negotiated value.
      serverMaxWindowBits: 10, // Defaults to negotiated value.
      // Below options specified as default values.
      concurrencyLimit: 10, // Limits zlib concurrency for perf.
      threshold: 1024 // Size (in bytes) below which messages
      // should not be compressed.
    }
  });
  const wsForSession = new Map<SessionID, WebSocket>();
  const containerForSession = new Map<SessionID, CalderaContainer>();

  const dispatch = (session: SessionID, msgs: CalderaRPCMessage[]) => {
    const ws = wsForSession.get(session);
    if (!ws) {
      throw new Error(`Invalid session: ${session}`);
    }

    ws.send(writeRPCMessages(msgs));
  };

  const renderer = createRenderer(makeDispatcher(dispatch));

  wss.on(
    "connection",
    (ws: WebSocket, session: SessionID, savedState?: Buffer) => {
      console.log("Websocket Connection ID:", session);
      wsForSession.set(session, ws);
      const container = renderer.render(app, session, savedState);
      containerForSession.set(session, container);

      ws.on("message", msg => {
        const data: CalderaRPCEvent = readRPCEvent(
          new Uint8Array(msg as Buffer)
        );
        container.dispatchEvent(data);
      });

      ws.on("close", async () => {
        savedStates.set(session, container.serializeState());
        await container.shutdown();
        wsForSession.delete(session);
        containerForSession.delete(session);
      });
    }
  );

  server.on("upgrade", (request: IncomingMessage, socket, head) => {
    console.log("Initial url", request.url);
    const tokenFromCookie =
      request.headers.cookie &&
      (cookie.parse(request.headers.cookie)[CALDERA_SESSION_TOKEN_COOKIE] as
        | SessionID
        | undefined);

    let session = (tokenFromCookie ?? nanoid()) as SessionID;
    let savedState = tokenFromCookie
      ? savedStates.get(tokenFromCookie)
      : undefined;

    // if latest websocket is still active then we need to create a new
    //  session ID to use, and retrieve that websocket's serialized state
    if (tokenFromCookie && wsForSession.get(tokenFromCookie)) {
      session = nanoid() as SessionID;
      savedState = containerForSession.get(tokenFromCookie)?.serializeState();
      console.log(
        "ALERT: WebSocket already exists for session ID:",
        tokenFromCookie
      );
      console.log("Creating new Websocket connection ID:", session);
    }

    wss.handleUpgrade(request, socket, head, ws => {
      wss.emit("connection", ws, session, savedState);
    });
  });

  const { port = 8080, hostname } = options;
  server.listen(port, hostname, () => {
    console.log(`🌋  Server started on port ${port}`);
  });
};

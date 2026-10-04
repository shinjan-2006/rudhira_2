import http from "node:http";
import handler from "../api/network.js";
http
  .createServer(async (req, res) => {
    let body = "";
    for await (const chunk of req) {
      body += chunk;
      if (body.length > 16384) {
        res.writeHead(413).end();
        return;
      }
    }
    try {
      req.body = body ? JSON.parse(body) : undefined;
    } catch {
      res
        .writeHead(400, { "Content-Type": "application/json" })
        .end(JSON.stringify({ error: "Invalid JSON." }));
      return;
    }
    res.status = (code) => {
      res.statusCode = code;
      return res;
    };
    res.json = (data) => res.end(JSON.stringify(data));
    res.setHeader("Content-Type", "application/json");
    await handler(req, res);
  })
  .listen(8001, "127.0.0.1", () =>
    console.log("Rudhira API listening on http://127.0.0.1:8001"),
  );

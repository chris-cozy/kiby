const http = require("http");

function createHealthServer(options) {
  const { port, getState, logger } = options;

  const server = http.createServer((req, res) => {
    if (req.url !== "/health") {
      res.writeHead(404, { "content-type": "application/json" });
      res.end(JSON.stringify({ error: "not-found" }));
      return;
    }

    const state = getState();
    const statusCode = state.discordReady && state.dbReady ? 200 : 503;

    res.writeHead(statusCode, { "content-type": "application/json" });
    res.end(
      JSON.stringify({
        status: statusCode === 200 ? "ok" : "degraded",
        ...state,
      })
    );
  });

  return {
    listen() {
      server.listen(port, () => {
        logger.info("Health server listening", { port });
      });
    },
    close() {
      return new Promise((resolve) => {
        server.close(() => {
          resolve();
        });
      });
    },
  };
}

module.exports = {
  createHealthServer,
};

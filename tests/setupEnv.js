if (!process.env.TOKEN) {
  process.env.TOKEN = "test-token";
}

if (!process.env.MONGO_CONNECTION) {
  process.env.MONGO_CONNECTION = "mongodb://localhost:27017/kiby-test";
}

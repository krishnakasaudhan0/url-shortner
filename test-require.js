try {
  const app = require('./server.js');
  console.log("Require Success");
} catch (e) {
  console.error("Require Failed:", e);
}

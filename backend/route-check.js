const routes = [
  './routes/tournaments',
  './routes/teams',
  './routes/players',
  './routes/matchs',
  './routes/innings',
  './routes/scoring',
  './routes/analytics',
  './routes/aouth',
  './middleware/errorHandler',
  './middleware/auth',
];

let allOk = true;
for (const r of routes) {
  try {
    require(r);
    console.log(`✓ ${r}`);
  } catch (e) {
    console.error(`✗ ${r}: ${e.message}`);
    allOk = false;
  }
}
console.log(allOk ? '\nAll routes loaded OK!' : '\nSome routes failed!');
process.exit(allOk ? 0 : 1);

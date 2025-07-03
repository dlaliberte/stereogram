import express from 'express';

const app = express();
const port = 3001;

app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello from the server!' });
});

// We start the server ourselves now
app.listen(port, () => {
  console.log(`[server] Server running at http://localhost:${port}`);
});

// We can keep this export for testing purposes
export { app };

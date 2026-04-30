import app from './app';
import { AppDataSource } from './data-source';

// Application entrypoint: initialize DB connection then start HTTP server.
const PORT = parseInt(process.env.PORT || '3000', 10);

AppDataSource.initialize()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server started on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    // If DB cannot initialize, fail fast and log the error for debugging.
    console.error('DataSource initialization error:', err);
  });

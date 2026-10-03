require('dotenv').config();
const app = require('./app');
const initDb = require('./models/initDb');

const PORT = process.env.PORT || 5000;

initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 ConceptFlow Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ Failed to initialize database on startup:', err.message);
    process.exit(1);
  });

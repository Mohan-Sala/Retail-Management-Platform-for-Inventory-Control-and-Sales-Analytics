require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const mongoose = require("mongoose");

const resetDatabase = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      console.error("[Reset] Error: MONGO_URI environment variable is missing.");
      process.exit(1);
    }
    console.log(`[Reset] Connecting to MongoDB Atlas...`);
    await mongoose.connect(mongoUri);

    console.log("[Reset] Connected. Dropping existing collections...");

    const collections = Object.keys(mongoose.connection.collections);
    for (const name of collections) {
      console.log(`[Reset] Dropping collection: ${name}`);
      await mongoose.connection.collections[name].drop().catch((err) => {
        // Ignore errors when collection does not exist
        if (err.code !== 26) {
          console.error(`Error dropping collection ${name}:`, err.message);
        }
      });
    }

    console.log("[Reset] Database reset completed successfully!");
  } catch (error) {
    console.error("[Reset] Error resetting database:", error);
  } finally {
    await mongoose.disconnect();
    console.log("[Reset] Disconnected from MongoDB.");
  }
};

resetDatabase();

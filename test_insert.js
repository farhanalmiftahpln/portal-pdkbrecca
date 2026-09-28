import { db } from './src/db/index.js';
import { gasCache } from './src/db/schema.js';

async function test() {
  try {
    const payload = {};
    const responseData = { test: true };
    await db.insert(gasCache)
      .values({ id: "test", action: "test", payload: payload, data: responseData, updatedAt: new Date() })
      .onConflictDoUpdate({ target: gasCache.id, set: { data: responseData, updatedAt: new Date() } });
    console.log("Success");
  } catch(e) {
    console.log("Error", e);
  }
}
test();

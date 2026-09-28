const fs = require('fs');
let code = fs.readFileSync('src/db/schema.ts', 'utf8');

const targetCache = `export const gasCache = pgTable("gas_cache", {
  action: text("action").primaryKey(),
  payload: jsonb("payload"),
  data: jsonb("data"),
  updatedAt: timestamp("updated_at").defaultNow(),
});`;

const replacementCache = `export const gasCache = pgTable("gas_cache", {
  id: text("id").primaryKey(), // We will use a combination of action and payload hash
  action: text("action").notNull(),
  payload: jsonb("payload"),
  data: jsonb("data"),
  updatedAt: timestamp("updated_at").defaultNow(),
});`;

code = code.replace(targetCache, replacementCache);
fs.writeFileSync('src/db/schema.ts', code);

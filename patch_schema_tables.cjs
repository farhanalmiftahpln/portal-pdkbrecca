const fs = require('fs');
let code = fs.readFileSync('src/db/schema.ts', 'utf8');

const additionalTables = `

export const workOrders = pgTable("work_orders", {
  id: text("id").primaryKey(),
  noWo: text("no_wo").notNull(),
  status: text("status").notNull(),
  ulp: text("ulp"),
  gi: text("gi"),
  data: jsonb("data")
});

export const personil = pgTable("personil", {
  id: text("id").primaryKey(), // We can use NIP or Nama as ID
  nama: text("nama").notNull(),
  jabatan: text("jabatan"),
  data: jsonb("data")
});

export const tracking = pgTable("tracking", {
  noWo: text("no_wo").primaryKey(),
  status: text("status"),
  data: jsonb("data")
});
`;

if(!code.includes("workOrders")) {
  code += additionalTables;
  fs.writeFileSync('src/db/schema.ts', code);
  console.log("Updated schema.");
} else {
  console.log("Schema already updated.");
}

const d = new Date("2026-07-14T16:00:00.000Z");
const localDate = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().split('T')[0];
console.log(localDate);

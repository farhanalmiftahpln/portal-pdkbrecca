const hist = [
  { status: 'A', tanggal: '2026-09-05T09:31:00.000Z', index: 1 },
  { status: 'B', tanggal: '2026-09-05T09:31:00.000Z', index: 2 }
];
hist.sort((a, b) => {
  const d = new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime();
  if (d === 0) return a.index - b.index;
  return d;
});
console.log(hist);

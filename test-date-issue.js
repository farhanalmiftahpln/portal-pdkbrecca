async function run() {
  const url = "https://script.google.com/macros/s/AKfycbx_TinZ9UQ5_3U4Vmcd-sO509PztlKW5r8Ugt-cJZV6Eu6erYYwwkn2xXs_8z_XTDo6/exec";
  const res = await fetch(url, {
    method: 'POST',
    body: JSON.stringify({ action: "getReviewedWOs" }),
    headers: { 'Content-Type': 'text/plain;charset=utf-8' }
  });
  const data = await res.json();
  const wos = data.data;
  console.log("Total WOs:", wos.length);
  const withDate = wos.filter(w => w.tanggalRencanakan);
  console.log("Sample dates from getReviewedWOs:");
  withDate.slice(0,5).forEach(w => {
     console.log(w.noWo, "=>", w.tanggalRencanakan);
  });
}
run();

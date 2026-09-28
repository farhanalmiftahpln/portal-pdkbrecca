async function run() {
  const url = "https://script.google.com/macros/s/AKfycbx_TinZ9UQ5_3U4Vmcd-sO509PztlKW5r8Ugt-cJZV6Eu6erYYwwkn2xXs_8z_XTDo6/exec";
  const res = await fetch(url, {
    method: 'POST',
    body: JSON.stringify({ action: "getReviewedWOs" }),
    headers: { 'Content-Type': 'text/plain;charset=utf-8' }
  });
  const data = await res.json();
  console.log("getReviewedWOs response:", JSON.stringify(data.data.slice(0,2), null, 2));
}
run();

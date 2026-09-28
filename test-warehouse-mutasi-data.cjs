async function test() {
  const payload = {
    sheetName: "MUTASI MATERIAL"
  };
  
  const res = await fetch("https://script.google.com/macros/s/AKfycbx_TinZ9UQ5_3U4Vmcd-sO509PztlKW5r8Ugt-cJZV6Eu6erYYwwkn2xXs_8z_XTDo6/exec", {
    method: 'POST',
    body: JSON.stringify({ action: "getWarehouseData", payload }),
    headers: { 'Content-Type': 'text/plain;charset=utf-8' }
  });
  
  const text = await res.json();
  if (text.data) {
     console.log("Total mutasi data:", text.data.length);
  } else {
     console.log(text);
  }
}

test();

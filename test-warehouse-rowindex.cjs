async function test() {
  const res = await fetch("https://script.google.com/macros/s/AKfycbx_TinZ9UQ5_3U4Vmcd-sO509PztlKW5r8Ugt-cJZV6Eu6erYYwwkn2xXs_8z_XTDo6/exec", {
    method: 'POST',
    body: JSON.stringify({ action: "getWarehouseData", payload: { sheetName: "MATERIAL" } }),
    headers: { 'Content-Type': 'text/plain;charset=utf-8' }
  });
  
  const text = await res.json();
  const data = text.data;
  let missing = 0;
  data.forEach((item, i) => {
    if (!item._rowIndex) {
      console.log(`Item at index ${i} is missing _rowIndex:`, item);
      missing++;
    }
  });
  console.log(`Total missing _rowIndex: ${missing} out of ${data.length}`);
}

test();

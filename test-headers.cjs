fetch('https://script.google.com/macros/s/AKfycbx_TinZ9UQ5_3U4Vmcd-sO509PztlKW5r8Ugt-cJZV6Eu6erYYwwkn2xXs_8z_XTDo6/exec', {
  method: 'POST',
  body: JSON.stringify({ action: "getLlcList" }),
  headers: { 'Content-Type': 'text/plain' }
})
.then(res => res.json())
.then(json => {
  if (json.success && json.data.length > 0) {
    console.log(Object.keys(json.data[0]));
  } else {
    console.log(json);
  }
})
.catch(console.error);

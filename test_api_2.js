const url = "https://script.google.com/macros/s/AKfycbwXj7bweuYbXEput0apRdJh0LoXQgNogb6ryXbDlftOBdwtKP7jjVafRqe4pQ0uY-s/exec";
const payload = {
  action: "getOptions"
};

fetch(url, {
  method: 'POST',
  redirect: 'follow',
  body: JSON.stringify(payload)
})
.then(async r => {
  console.log("Status:", r.status);
  console.log("StatusText:", r.statusText);
  const text = await r.text();
  console.log("Body length:", text.length);
  console.log("Body snippet:", text.substring(0, 100));
})
.catch(err => console.error("FETCH ERROR:", err));

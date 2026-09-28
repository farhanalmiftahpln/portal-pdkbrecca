async function run() {
  const GAS_URL = "https://script.google.com/macros/s/AKfycbwXj7bweuYbXEput0apRdJh0LoXQgNogb6ryXbDlftOBdwtKP7jjVafRqe4pQ0uY-s/exec";
  const response = await fetch(GAS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify({ action: "login", payload: { nip: "test", password: "test" } }),
    redirect: 'follow'
  });
  console.log("Status:", response.status);
  const text = await response.text();
  console.log("Response text:", text.substring(0, 300));
}
run();

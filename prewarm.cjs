async function run() {
  const GAS_URL = "https://script.google.com/macros/s/AKfycbwXj7bweuYbXEput0apRdJh0LoXQgNogb6ryXbDlftOBdwtKP7jjVafRqe4pQ0uY-s/exec";
  const actions = ["getDashboardStats", "getWorkPlans", "getWorkOrders", "getAllPersonil", "getRealisasiList", "getWarehouseData"];
  
  for (const action of actions) {
    console.log("Pre-warming:", action);
    try {
      const response = await fetch("http://localhost:3000/api/gas", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: action, payload: {} })
      });
      const data = await response.json();
      console.log(action, data.success ? "Success" : "Failed");
    } catch(e) {
      console.error(action, e.message);
    }
  }
}
run();

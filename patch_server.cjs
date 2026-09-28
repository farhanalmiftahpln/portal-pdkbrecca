const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const targetProxyStr = `    // (Dual-write logic will go here)
    
    res.json({ success: false, message: "Dual write not implemented yet" });`;

const replaceProxyStr = `    const GAS_URL = "https://script.google.com/macros/s/AKfycbwXj7bweuYbXEput0apRdJh0LoXQgNogb6ryXbDlftOBdwtKP7jjVafRqe4pQ0uY-s/exec";
    
    // Asynchronous Dual-Write implementation
    // Right now, we will just proxy for the first iteration.
    try {
      const response = await fetch(GAS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, payload })
      });
      
      const responseText = await response.text();
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch(e) {
        responseData = { success: false, message: "Invalid JSON from GAS", raw: responseText };
      }
      
      res.json(responseData);
    } catch (error) {
      console.error("Proxy error:", error);
      res.status(500).json({ success: false, message: "Proxy error to GAS" });
    }`;

code = code.replace(targetProxyStr, replaceProxyStr);
fs.writeFileSync('server.ts', code);

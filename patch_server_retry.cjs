const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const targetStr = `      // Proxy to GAS
      const response = await fetch(GAS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ action, payload })
      });
      
      const responseText = await response.text();
      try {
        responseData = JSON.parse(responseText);
      } catch(e) {
        responseData = { success: false, message: "Invalid JSON from GAS", raw: responseText };
      }`;

const replacement = `      // Proxy to GAS with Retry Logic for Transient HTML errors
      let responseText = "";
      let retries = 3;
      while (retries > 0) {
        try {
          const response = await fetch(GAS_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify({ action, payload })
          });
          responseText = await response.text();
          responseData = JSON.parse(responseText);
          break; // Success
        } catch(e) {
          retries--;
          console.error(\`Failed to parse GAS JSON. Retries left: \${retries}. Response: \${responseText.substring(0, 100)}\`);
          if (retries === 0) {
             responseData = { success: false, message: "Server GAS sedang sibuk, silakan coba lagi.", raw: responseText };
          } else {
             // Wait 1 second before retrying
             await new Promise(res => setTimeout(res, 1000));
          }
        }
      }`;

if(code.includes('// Proxy to GAS\n      const response = await fetch(GAS_URL')) {
    code = code.replace(targetStr, replacement);
    fs.writeFileSync('server.ts', code);
    console.log("Patched server with retry logic.");
} else {
    console.log("Could not find the target string.");
}

const fs = require('fs');
let content = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');

const injection = `
  // KEEP-ALIVE / AUTO-REFRESH: Mencegah server tertidur (Scale-to-zero)
  useEffect(() => {
    const keepAliveInterval = setInterval(() => {
      console.log("Ping server to keep cache alive...");
      gasService.post("getDashboardStats", filters).then((data) => {
         if (data && data.success) {
            setStats(data.data);
         }
      }).catch(e => console.error("Keep-alive error", e));
    }, 10 * 60 * 1000); // 10 menit

    return () => clearInterval(keepAliveInterval);
  }, [filters]);
`;

content = content.replace('  useEffect(() => {\n    fetchDashboardData();\n  }, [filters]);', '  useEffect(() => {\n    fetchDashboardData();\n  }, [filters]);\n' + injection);

fs.writeFileSync('src/pages/Dashboard.tsx', content);
console.log("Patched Dashboard.tsx for Keep-Alive");

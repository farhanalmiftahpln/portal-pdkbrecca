const fs = require('fs');
let code = fs.readFileSync('src/pages/WorkPlan.tsx', 'utf8');

code = code.replace(
  'const [showSWAModal, setShowSWAModal] = useState(false);',
  'const [showSWAModal, setShowSWAModal] = useState(false);\n  const [confirmDialog, setConfirmDialog] = useState<{ message: string; onConfirm: () => void } | null>(null);'
);

code = code.replace(
  /if \(!confirm\("Apakah Anda yakin ingin menyelesaikan pekerjaan ini\?"\)\) return;/g,
  'setConfirmDialog({ message: "Apakah Anda yakin ingin menyelesaikan pekerjaan ini?", onConfirm: async () => {\n                                    setConfirmDialog(null);'
);
// Make sure to close the block for the completion
code = code.replace(
  /setLoadingDetail\(false\);\n                                    \}\n                                  \}\}/g,
  'setLoadingDetail(false);\n                                    }\n                                  }});\n                                  }}'
);

fs.writeFileSync('src/pages/WorkPlan.tsx', code);

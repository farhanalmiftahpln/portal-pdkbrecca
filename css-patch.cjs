const fs = require('fs');
let css = fs.readFileSync('src/index.css', 'utf8');
if (!css.includes('animate-pulse-slow')) {
  css += `
@layer utilities {
  .custom-scrollbar::-webkit-scrollbar {
    width: 4px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.2);
  }
  .animate-pulse-slow {
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }
}
`;
  fs.writeFileSync('src/index.css', css);
  console.log("Updated CSS");
}

const fs = require('fs');
let code = fs.readFileSync('src/pages/ReviewWO.tsx', 'utf8');

// 1. Add detailLoading state
code = code.replace(
  "const [loading, setLoading] = useState(false);",
  "const [loading, setLoading] = useState(false);\n  const [detailLoading, setDetailLoading] = useState(false);"
);

// 2. Modify handleViewDetail
const oldHandle = `  const handleViewDetail = async (wo: any) => {
    setLoading(true);
    const res = await gasService.post('getReviewDetail', { noWo: wo.noWo });
    if (res.success && res.data) {
      setViewingDetail({ ...wo, details: res.data });
    }
    setLoading(false);
  };`;

const newHandle = `  const handleViewDetail = async (wo: any) => {
    if (viewingDetail?.noWo === wo.noWo) return;
    setDetailLoading(true);
    // Optimistically set viewingDetail without details to show selection immediately? Or keep old?
    // Let's just set the basic data first so the UI updates instantly
    setViewingDetail({ ...wo, details: null }); 
    const res = await gasService.post('getReviewDetail', { noWo: wo.noWo });
    if (res.success && res.data) {
      setViewingDetail({ ...wo, details: res.data });
    }
    setDetailLoading(false);
  };`;

code = code.replace(oldHandle, newHandle);

// 3. Update the left pane rendering (wo.temuan + status)
const oldCard = `<div className="text-[10px] font-mono font-bold text-primary mb-1">NO: {wo.noWo}</div>
                              <div className="text-xs font-bold text-gray-200 line-clamp-2 leading-tight mb-1.5">{wo.temuan || 'Normal Assessment'}</div>
                              <div className="text-[9px] text-gray-500 line-clamp-2 leading-tight mt-auto flex gap-1">`;

const newCard = `<div className="text-[10px] font-mono font-bold text-primary mb-1">NO: {wo.noWo}</div>
                              <div className="text-xs font-bold text-gray-200 line-clamp-2 leading-tight mb-1">{wo.temuan || 'Normal Assessment'}</div>
                              <div className={cn("text-[9px] font-bold uppercase tracking-widest mb-1.5", wo.approvalPreparator?.toLowerCase().includes('tidak layak') ? 'text-red-400' : wo.approvalPreparator?.toLowerCase().includes('layak') ? 'text-green-400' : 'text-yellow-400')}>{wo.approvalPreparator || 'Menunggu'}</div>
                              <div className="text-[9px] text-gray-500 line-clamp-1 leading-tight mt-auto flex gap-1">`;

code = code.replace(oldCard, newCard);

// 4. Update the right pane to show detailLoading
const oldRightPane = `{viewingDetail ? (
                   <div className="absolute inset-0 flex flex-col">
                     <div className="p-6 overflow-y-auto space-y-8 flex-1 custom-scrollbar">`;

const newRightPane = `{viewingDetail ? (
                   <div className="absolute inset-0 flex flex-col">
                     {detailLoading && !viewingDetail.details ? (
                       <div className="flex-1 flex flex-col items-center justify-center">
                         <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
                         <p className="text-xs uppercase font-bold tracking-widest text-gray-400">Memuat Detail...</p>
                       </div>
                     ) : (
                       <div className="p-6 overflow-y-auto space-y-8 flex-1 custom-scrollbar">`;

// And close the new condition
const oldRightPaneEnd = `                                          </button>
                                       </div>
                   </div>
                ) : (
                   <div className="flex-1 flex flex-col items-center justify-center text-gray-500 p-6 text-center">`;

const newRightPaneEnd = `                                          </button>
                                       </div>
                     )}
                   </div>
                ) : (
                   <div className="flex-1 flex flex-col items-center justify-center text-gray-500 p-6 text-center">`;

code = code.replace(oldRightPane, newRightPane);
code = code.replace(oldRightPaneEnd, newRightPaneEnd);

fs.writeFileSync('src/pages/ReviewWO.tsx', code);

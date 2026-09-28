const wo = { temuan: undefined, details: { workOrder: { temuan: "Retak Tiang" } } };
console.log(wo.temuan || wo.details?.workOrder?.temuan || 'Normal Assessment');

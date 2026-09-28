const fs = require('fs');
let code = fs.readFileSync('src/pages/WorkPlan.tsx', 'utf8');

// Add useRef and useCallback
code = code.replace('import React, { useState, useEffect } from "react";', 'import React, { useState, useEffect, useRef, useCallback } from "react";');

// Add visibleCount state and observer inside WorkPlan component
const targetState = `  const [trackingData, setTrackingData] = useState<any>({});`;
const replacementState = `  const [trackingData, setTrackingData] = useState<any>({});

  const [visibleCount, setVisibleCount] = useState(15);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastElementRef = useCallback((node: HTMLDivElement) => {
    if (loading) return;
    if (observerRef.current) observerRef.current.disconnect();
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        setVisibleCount(prev => prev + 15);
      }
    }, { rootMargin: "200px" });
    if (node) observerRef.current.observe(node);
  }, [loading]);

  // Reset visible count when filter changes
  useEffect(() => {
    setVisibleCount(15);
  }, [searchQuery, filterTanggal, filterProgres, filterStatusBerkas]);`;

if (code.includes(targetState)) {
  code = code.replace(targetState, replacementState);
} else {
  console.log("targetState not found");
  process.exit(1);
}

// Modify the map
const targetMap = `              ) : (
                filteredPlans.map((wp: any, index) => (
                  <div
                    key={index}`;
const replacementMap = `              ) : (
                <>
                {filteredPlans.slice(0, visibleCount).map((wp: any, index) => {
                  const isLast = index === Math.min(filteredPlans.length, visibleCount) - 1;
                  return (
                  <div
                    ref={isLast ? lastElementRef : null}
                    key={index}`;

if (code.includes(targetMap)) {
  code = code.replace(targetMap, replacementMap);
} else {
  console.log("targetMap not found");
  process.exit(1);
}

// Close the fragment
// We need to find where the map ends.
// Let's use regex or string manipulation.
const mapEndTarget = `                    </div>
                  </div>
                ))
              )}
            </div>
          </div>`;
const mapEndReplacement = `                    </div>
                  </div>
                );
                })}
                </>
              )}
            </div>
          </div>`;

if (code.includes(mapEndTarget)) {
  code = code.replace(mapEndTarget, mapEndReplacement);
} else {
  console.log("mapEndTarget not found");
  process.exit(1);
}

fs.writeFileSync('src/pages/WorkPlan.tsx', code);
console.log("Successfully patched WorkPlan.tsx for lazy loading");

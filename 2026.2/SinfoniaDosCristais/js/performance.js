/* Frame telemetry is local and opt-in for inspection; it never sends data. */
(() => {
 'use strict';
 const intervals=new Float64Array(1800),costs=new Float64Array(1800);
 let count=0,cursor=0,previous=0;
 const percentile=(a,p)=>a.length?a[Math.min(a.length-1,Math.floor((a.length-1)*p))]:0;
 const api={
  begin(now,active){
   if(!active||document.hidden){previous=0;return 0;}
   if(previous){const dt=now-previous;if(dt>0){intervals[cursor]=dt;costs[cursor]=0;cursor=(cursor+1)%intervals.length;count=Math.min(count+1,intervals.length);}}
   previous=now;return performance.now();
  },
  end(start){if(start&&count)costs[(cursor+costs.length-1)%costs.length]=performance.now()-start;},
  reset(){count=0;cursor=0;previous=0;intervals.fill(0);costs.fill(0);},
  report(){const samples=Array.from(intervals.subarray(0,count)).sort((a,b)=>a-b),work=Array.from(costs.subarray(0,count)).sort((a,b)=>a-b),mean=samples.reduce((a,b)=>a+b,0)/Math.max(1,count);return {samples:count,fps:mean?1000/mean:0,frameMsMedian:percentile(samples,.5),frameMsP95:percentile(samples,.95),frameMsP99:percentile(samples,.99),updateMsP95:percentile(work,.95),framesOver25ms:samples.filter(v=>v>25).length};}
 };
 window.CrystalPerformance=api;
})();

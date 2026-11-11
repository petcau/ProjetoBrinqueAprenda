'use strict';
(() => {
  const nodes={carlos:[245,245],inicio:[286,260],esquerda:[300,340],cisterna:[330,400],registro:[395,385],beira:[470,415],ponteOeste:[520,408],ponte:[575,405],ponteLeste:[646,403],centro:[745,385],flores:[820,365],bifurcacao:[855,285],alto:[900,200],norte:[1000,145],ponta:[1130,180],leste:[1160,290],resgateLeste:[1190,355],cruzamento:[990,410],fundo:[1100,435],sul:[1110,550],baixo:[1000,610],fim:[890,635],oeste:[220,470],cinza:[170,555]};
  const edges=[['carlos','inicio',35],['inicio','esquerda',35],['esquerda','cisterna',30],['cisterna','registro',27],['registro','beira',30],['beira','ponteOeste',22],['ponteOeste','ponte',22],['ponte','ponteLeste',22],['ponteLeste','centro',34],['centro','flores',38],['flores','bifurcacao',35],['bifurcacao','alto',35],['alto','norte',37],['norte','ponta',40],['ponta','leste',35],['leste','resgateLeste',32],['resgateLeste','fundo',35],['flores','cruzamento',35],['cruzamento','fundo',35],['fundo','sul',33],['sul','baixo',30],['baixo','fim',35],['cisterna','oeste',32],['oeste','cinza',40]];
  const zones=[[[195,225],[330,220],[355,290],[310,325],[210,300]],[[130,485],[240,460],[300,530],[270,580],[180,600],[120,555]],[[675,360],[785,305],[860,330],[865,415],[740,430]],[[890,120],[1025,90],[1165,135],[1200,205],[1120,230],[970,200]],[[1100,300],[1230,290],[1240,400],[1150,435],[1085,380]],[[1020,490],[1190,470],[1240,550],[1130,610],[1000,635],[920,660],[855,650],[865,610]]];
  const river=[[475,0],[535,0],[575,145],[562,220],[580,290],[610,365],[627,470],[663,570],[730,720],[650,720],[585,600],[580,520],[540,440],[512,360],[520,285],[510,220],[510,160],[475,100]];
  const bridge=[[495,378],[663,378],[663,435],[495,435]];
  const fires=[{id:0,x:727,y:222,rx:90,ry:73},{id:1,x:950,y:340,rx:105,ry:70},{id:2,x:1025,y:112,rx:110,ry:77},{id:3,x:1175,y:205,rx:100,ry:65},{id:4,x:1160,y:395,rx:110,ry:75},{id:5,x:1090,y:545,rx:100,ry:77},{id:6,x:885,y:625,rx:115,ry:74},{id:7,x:220,y:555,rx:117,ry:89}];
  const animals=[{id:'capivara',name:'Capivara',x:260,y:540,fires:[7],height:38,home:{x:226,y:282}},{id:'cervo',name:'Cervo',x:1190,y:240,fires:[2,3],height:49,home:{x:205,y:255}},{id:'passaro',name:'Passarinho',x:1120,y:490,fires:[5,6],height:36,home:{x:250,y:294}}];
  const trees=[{x:88,y:465,h:160,frame:0},{x:430,y:270,h:130,frame:1},{x:690,y:155,h:142,frame:0},{x:860,y:485,h:130,frame:1},{x:1230,y:650,h:155,frame:0},{x:390,y:670,h:155,frame:1}];
  function inside(p,poly){let yes=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const [x,y]=poly[i],[xx,yy]=poly[j];if((y>p.y)!==(yy>p.y)&&p.x<(xx-x)*(p.y-y)/(yy-y)+x)yes=!yes;}return yes;}
  const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
  function segment(p,a,b){const dx=b[0]-a[0],dy=b[1]-a[1],t=Math.max(0,Math.min(1,((p.x-a[0])*dx+(p.y-a[1])*dy)/(dx*dx+dy*dy)));return Math.hypot(p.x-a[0]-dx*t,p.y-a[1]-dy*t);}
  const walkable=p=>p.x>12&&p.x<1268&&p.y>20&&p.y<700&&(!inside(p,river)||inside(p,bridge))&&(zones.some(z=>inside(p,z))||edges.some(([a,b,w])=>segment(p,nodes[a],nodes[b])<=w));
  function visible(a,b){const d=distance(a,b),n=Math.max(1,Math.ceil(d/3));for(let i=0;i<=n;i++)if(!walkable({x:a.x+(b.x-a.x)*i/n,y:a.y+(b.y-a.y)*i/n}))return false;return true;}
  function nearest(p){const ids=Object.keys(nodes).sort((a,b)=>distance(p,{x:nodes[a][0],y:nodes[a][1]})-distance(p,{x:nodes[b][0],y:nodes[b][1]}));return ids.find(id=>visible(p,{x:nodes[id][0],y:nodes[id][1]}))||ids[0];}
  function route(from,to){
    const start=nearest(from),end=nearest(to),cost={},prev={},todo=new Set(Object.keys(nodes));for(const id of todo)cost[id]=Infinity;cost[start]=0;
    while(todo.size){const id=[...todo].reduce((a,b)=>cost[a]<cost[b]?a:b);todo.delete(id);if(id===end)break;for(const [a,b] of edges){const next=a===id?b:b===id?a:null;if(!next||!todo.has(next))continue;const c=cost[id]+Math.hypot(nodes[a][0]-nodes[b][0],nodes[a][1]-nodes[b][1]);if(c<cost[next]){cost[next]=c;prev[next]=id;}}}
    const path=[end];while(path[0]!==start){if(!prev[path[0]])return [];path.unshift(prev[path[0]]);}return path.map(id=>({x:nodes[id][0],y:nodes[id][1]}));
  }
  window.FlorestaMundo=Object.freeze({width:1280,height:720,nodes,edges,zones,river,bridge,fires,animals,trees,inside,distance,walkable,route,nearest});
})();

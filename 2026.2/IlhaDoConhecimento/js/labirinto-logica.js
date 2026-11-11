/* Funções puras: sorteio, máscara, movimento, hit-tests e navegação. */
window.LabirintoLogica = (() => {
  'use strict';
  function shuffle(values) {
    const a=values.slice();
    // Fisher–Yates: cada posição troca com uma posição ainda não sorteada, sem viés.
    for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1)),v=a[i];a[i]=a[j];a[j]=v;}
    return a;
  }
  const sequence=ids=>shuffle(ids).slice(0,3);
  function removeBlackBorder(p,w,h) {
    const seen=new Uint8Array(w*h),stack=new Int32Array(w*h);let top=0,removed=0;
    // Inundação iterativa de 4 vizinhos: só o quase preto ligado às bordas perde o alfa.
    function add(i){if(!seen[i]&&Math.max(p[i*4],p[i*4+1],p[i*4+2])<=12){seen[i]=1;stack[top++]=i;}}
    for(let x=0;x<w;x++){add(x);add((h-1)*w+x);}for(let y=0;y<h;y++){add(y*w);add(y*w+w-1);}
    while(top){const i=stack[--top],x=i%w;if(p[i*4+3]){p[i*4+3]=0;removed++;}
      if(x>0)add(i-1);if(x+1<w)add(i+1);if(i>=w)add(i-w);if(i+w<w*h)add(i+w);
    }
    return removed;
  }
  function pedestals(ids,s,k) {
    const out=[s[k-1],shuffle(ids.filter(id=>!s.includes(id)))[0]];
    if(k===2)out.push(shuffle([s[0],s[2]])[0]);
    if(k===3)out.push(s[0],s[1]);
    return shuffle(out);
  }
  function randomTest(ids) {
    for(let n=0;n<300;n++){
      const s=sequence(ids);if(new Set(s).size!==3)throw Error('Sequência repetida');
      for(let k=1;k<=3;k++){
        const p=pedestals(ids,s,k);
        if(p.length!==k+1||new Set(p).size!==p.length||p.filter(id=>id===s[k-1]).length!==1||p.filter(id=>!s.includes(id)).length!==1||p.filter(id=>s.includes(id)&&id!==s[k-1]).length!==k-1)throw Error(`Distratores do cruzamento ${k}`);
      }
    }
    return '300 sorteios: OK';
  }
  function field(mask,w,h,k=1,fw=8,fh=4,circle=null,nudge=0){return {mask,w,h,k,hw:fw/2,hh:fh/2,circle,nudge};}
  function walkable(f,x,y) {
    // Design → pixel original da máscara; só o alfa >40 vira 1 no carregamento.
    const u=Math.floor(x/f.k),v=Math.floor(y/f.k);
    return u>=0&&v>=0&&u<f.w&&v<f.h&&Boolean(f.mask[v*f.w+u]);
  }
  function fits(f,x,y,margin=0) {
    const w=f.hw+margin,h=f.hh+margin,c=f.circle;
    if(!walkable(f,x-w,y-h)||!walkable(f,x+w,y-h)||!walkable(f,x-w,y+h)||!walkable(f,x+w,y+h))return false;
    return !c||Math.hypot(Math.max(0,Math.abs(x-c.x)-w),Math.max(0,Math.abs(y-c.y)-h))>c.r;
  }
  function move(f,p,dx,dy) {
    // Dividimos o vetor inteiro em ≤1 px, com X antes de Y em cada subpasso.
    // Fazer todo X antes de todo Y criava um degrau maior em diagonais com dt alto.
    const x=p.x,y=p.y,n=Math.max(1,Math.ceil(Math.hypot(dx,dy))),sx=dx/n,sy=dy/n;
    for(let i=0;i<n;i++){if(fits(f,p.x+sx,p.y))p.x+=sx;if(fits(f,p.x,p.y+sy))p.y+=sy;}
    // Bordas de máscara pintadas têm pequenos degraus: um ajuste perpendicular libera o canto.
    // Conferimos todo o deslocamento e a saída adiante para não pular paredes nem oscilar nelas.
    if(p.x===x&&p.y===y&&(dx||dy))for(let d=1;d<=f.nudge;d++)for(let sign=-1;sign<=1;sign+=2){
      const nx=Math.abs(dx)>=Math.abs(dy)?x:x+d*sign,ny=Math.abs(dx)>=Math.abs(dy)?y+d*sign:y;
      if(line(f,x,y,nx,ny)&&fits(f,nx+Math.sign(dx),ny+Math.sign(dy))){p.x=nx;p.y=ny;return;}
    }
  }
  function hit(p,z,w,h){return p.x+w/2>=z[0]&&p.x-w/2<=z[0]+z[2]&&p.y+h/2>=z[1]&&p.y-h/2<=z[1]+z[3];}
  function line(f,x,y,tx,ty,margin=0) {
    const n=Math.max(1,Math.ceil(Math.hypot(tx-x,ty-y)));
    for(let i=0;i<=n;i++)if(!fits(f,x+(tx-x)*i/n,y+(ty-y)*i/n,margin))return false;
    return true;
  }
  function grid(f,cell=8,margin=2) {
    const cols=Math.ceil(f.w*f.k/cell),rows=Math.ceil(f.h*f.k/cell),size=cols*rows;
    const g={f,cell,cols,rows,free:new Uint8Array(size),edges:new Uint8Array(size),parent:new Int32Array(size),queue:new Int32Array(size)};
    for(let i=0;i<size;i++)g.free[i]=fits(f,(i%cols+.5)*cell,(Math.floor(i/cols)+.5)*cell,margin)?1:0;
    // Margem adicional de 2 px; também verificamos cada aresta para não atravessar fendas.
    for(let i=0;i<size;i++)if(g.free[i]){
      const x=(i%cols+.5)*cell,y=(Math.floor(i/cols)+.5)*cell;
      if(i%cols+1<cols&&g.free[i+1]&&line(f,x,y,x+cell,y,margin)){g.edges[i]|=1;g.edges[i+1]|=2;}
      if(i+cols<size&&g.free[i+cols]&&line(f,x,y,x,y+cell,margin)){g.edges[i]|=4;g.edges[i+cols]|=8;}
    }
    return g;
  }
  function search(g,x,y) {
    let start=-1,best=60*60;
    for(let i=0;i<g.free.length;i++)if(g.free[i]){
      const tx=(i%g.cols+.5)*g.cell,ty=(Math.floor(i/g.cols)+.5)*g.cell,d=(tx-x)**2+(ty-y)**2;
      if(d<best&&line(g.f,x,y,tx,ty)){best=d;start=i;}
    }
    const parent=g.parent,q=g.queue;parent.fill(-1);if(start<0)return 0;
    // BFS usa fila/antecessores reutilizados; só a reconstrução no toque aloca o caminho.
    let head=0,tail=1;q[0]=start;parent[start]=start;
    function add(i){if(parent[i]<0){parent[i]=q[head];q[tail++]=i;}}
    while(head<tail){const i=q[head],e=g.edges[i];if(e&1)add(i+1);if(e&2)add(i-1);if(e&4)add(i+g.cols);if(e&8)add(i-g.cols);head++;}
    return tail;
  }
  function path(g,x,y,tx,ty) {
    const count=search(g,x,y);let end=-1,best=60*60;
    for(let j=0;j<count;j++){const i=g.queue[j],cx=(i%g.cols+.5)*g.cell,cy=(Math.floor(i/g.cols)+.5)*g.cell,d=(cx-tx)**2+(cy-ty)**2;
      if(d<best){end=i;best=d;}}
    if(end<0)return [];
    const out=[],raw=[];let i=end;
    while(true){raw.push({x:(i%g.cols+.5)*g.cell,y:(Math.floor(i/g.cols)+.5)*g.cell});if(g.parent[i]===i)break;i=g.parent[i];}
    raw.reverse();const last=raw[raw.length-1];
    if(fits(g.f,tx,ty)&&line(g.f,last.x,last.y,tx,ty))raw.push({x:tx,y:ty});
    // Remove intermediários apenas quando toda a reta aceita a mesma caixa de pés.
    for(let a=0;a<raw.length;){let b=raw.length-1;while(b>a&&!line(g.f,x,y,raw[b].x,raw[b].y))b--;out.push(raw[b]);x=raw[b].x;y=raw[b].y;a=b+1;}
    return out;
  }
  function geometryTest(g,spawn,zones,chamber) {
    const f=g.f,fail=[],count=search(g,spawn[0],spawn[1]);
    if(!fits(f,spawn[0],spawn[1]))fail.push('spawn não andável');
    for(const z of zones){let total=0,free=0,reached=false;
      for(let y=Math.ceil(z[1]);y<z[1]+z[3];y++)for(let x=Math.ceil(z[0]);x<z[0]+z[2];x++){total++;if(walkable(f,x,y))free++;}
      for(let j=0;j<count&&!reached;j++){const i=g.queue[j];reached=hit({x:(i%g.cols+.5)*g.cell,y:(Math.floor(i/g.cols)+.5)*g.cell},z,f.hw*2,f.hh*2);}
      if(free/total<.6)fail.push(`zona ${z.join(',')}: cobertura ${(free/total*100).toFixed(1)}%`);
      if(!reached)fail.push(`zona ${z.join(',')}: BFS sem acesso`);
    }
    if(chamber){let reached=false;for(let j=0;j<count;j++){const i=g.queue[j];if(Math.hypot((i%g.cols+.5)*g.cell-chamber.x,(Math.floor(i/g.cols)+.5)*g.cell-chamber.y)<=100){reached=true;break;}}if(!reached)fail.push('BFS sem acesso à chave');}
    return fail;
  }
  return Object.freeze({shuffle,sequence,removeBlackBorder,pedestals,randomTest,field,walkable,fits,move,hit,line,grid,path,geometryTest});
})();

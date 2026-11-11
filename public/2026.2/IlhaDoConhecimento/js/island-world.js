/* Mapa e colisões em coordenadas do mundo. Sem servidor ou arquivos de dados. */
window.IslandWorld = (() => {
  'use strict';
  const TILE = 48, COLS = 96, ROWS = 72;
  const terrain = {water:0, grass:1, sand:2, path:3, stone:4, bridge:5};
  const routes = [
    [[48,42],[48,36],[41,33],[33,29],[24,25],[20,21]],
    [[48,36],[55,38],[64,38],[72,36],[76,29],[77,22]],
    [[48,42],[43,46],[35,49],[26,53],[21,54]],
    [[72,36],[77,43],[78,53],[83,57]],
    [[26,53],[36,57],[47,58],[57,55],[64,55],[77,53]],
    [[48,36],[48,27],[48,20],[48,11]]
  ];
  const regions = [
    {id:'center', name:'Praça do Portal', short:'Praça', x:48, y:39, color:'#efd599'},
    {id:'forest', name:'Floresta dos Padrões', short:'Floresta', x:22, y:23, color:'#56844b'},
    {id:'village', name:'Aldeia do Saber', short:'Aldeia', x:25, y:53, color:'#c88864'},
    {id:'ruins', name:'Ruínas das Formas', short:'Ruínas', x:77, y:23, color:'#e2c383'},
    {id:'farm', name:'Campos Contados', short:'Campos', x:78, y:53, color:'#b0bc62'},
    {id:'mountain', name:'Pico do Miau', short:'Pico', x:48, y:12, color:'#8997a1'}
  ];
  const points = [
    {id:'guide', x:50, y:43, title:'Uma ilha inteira para descobrir', chapter:'PLACA DA PRAÇA', text:'O portal trouxe você até aqui! Siga os caminhos: a floresta fica à esquerda e acima; a vila, à esquerda e abaixo. Do outro lado das pontes estão as ruínas e a fazenda. O gato espera na montanha, ao norte.', note:'Explore com WASD ou setas. Perto de uma placa, use E. M abre o mapa e Esc pausa a aventura.', action:'Ler a placa'},
    {id:'portal', x:44, y:43, title:'O começo da sua aventura', chapter:'PORTAL DE CHEGADA', text:'Foi por este portal que você chegou à ilha em busca do seu gato. Guarde este lugar na memória: ele fica pertinho da praça central.', note:'Encontre as placas das quatro regiões. Cada uma leva a um desafio em um ambiente próprio. Conquiste as chaves e volte à montanha!', action:'Olhar o portal'},
    {id:'forest', x:21, y:23, title:'Floresta dos Padrões', chapter:'RACIOCÍNIO LÓGICO', text:'Entre árvores e trilhas, os padrões escondem pistas. Observe e repita sequências para conquistar a chave verde.', note:'Três desafios na clareira. Você pode rever a sequência e tentar de novo.', action:'Entrar na clareira'},
    {id:'village', x:26, y:54, title:'Vila do Conhecimento', chapter:'ÁLGEBRA INICIAL', text:'As casinhas desta vila guardam números misteriosos. Descubra o número que falta para conquistar a chave azul.', note:'Três desafios na biblioteca. Escolha o número que completa cada conta.', action:'Entrar na biblioteca'},
    {id:'ruins', x:77, y:24, title:'Ruínas das Formas', chapter:'GEOMETRIA', text:'As peças destas ruínas guardam um segredo. Gire cada peça até encontrar o encaixe e conquistar a chave vermelha.', note:'Três desafios no pátio. Compare a peça com o encaixe e gire um quarto de volta.', action:'Entrar no pátio das formas'},
    {id:'farm', x:78, y:54, title:'Fazenda dos Números', chapter:'OPERAÇÕES', text:'O moinho gira e a horta cresce! Escolha a resposta das contas para conquistar a chave amarela.', note:'Três desafios no moinho. Use as pistas e tente quantas vezes quiser.', action:'Entrar no moinho'},
    {id:'mountain', x:48, y:11, image:[1288,478], title:'Você encontrou seu gato!', label:'Montanha do Gato', action:'E — Examinar a cela'}
  ];
  function noise(x,y,seed=0) {
    let n = Math.imul(x + seed * 71,374761393) ^ Math.imul(y + seed * 19,668265263);
    n = Math.imul(n ^ (n >>> 13),1274126177);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
  }
  const ellipse = (x,y,cx,cy,rx,ry) => ((x-cx)/rx)**2 + ((y-cy)/ry)**2;
  function regionAt(x,y,fallbackId='center') {
    if(typeof getIslandRegion==='function'){
      return getIslandRegion(x/WORLD_SCALE,y/WORLD_SCALE,fallbackId);
    }
    const tx=x/TILE, ty=y/TILE;
    if(ty<23 && tx>36 && tx<59)return regions[5];
    if(tx<37 && ty<39)return regions[1];
    if(tx<38 && ty>=39)return regions[2];
    if(tx>66 && ty<40)return regions[3];
    if(tx>65 && ty>=40)return regions[4];
    return regions[0];
  }
  function create() {
    const tiles=new Uint8Array(COLS*ROWS), objects=[];
    const at=(x,y)=>x<0||y<0||x>=COLS||y>=ROWS?terrain.water:tiles[y*COLS+x];
    for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++) {
      const edge=Math.sin(x*.59+y*.28)*.035+Math.cos(y*.73-x*.23)*.035;
      const land=Math.min(ellipse(x,y,48,39,40,28),ellipse(x,y,22,25,19,18),ellipse(x,y,25,52,21,17),ellipse(x,y,75,25,18,19),ellipse(x,y,76,53,18,17),ellipse(x,y,48,16,14,13)) < 1+edge;
      const river=y>=27 && y<69 && Math.abs(x-64)<1.55;
      const lake=ellipse(x,y,64,26,4,4)<1;
      tiles[y*COLS+x]=land&&!river&&!lake?terrain.grass:terrain.water;
    }
    const original=tiles.slice();
    for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++)if(at(x,y)!==terrain.water) {
      let coast=false;
      for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++) {
        if(x+dx<0||y+dy<0||x+dx>=COLS||y+dy>=ROWS||original[(y+dy)*COLS+x+dx]===terrain.water)coast=true;
      }
      if(coast||ellipse(x,y,77,24,12,12)<1)tiles[y*COLS+x]=terrain.sand;
      if(ellipse(x,y,48,12,11,9)<1)tiles[y*COLS+x]=terrain.stone;
    }
    function disk(cx,cy,r,type) {
      for(let y=Math.floor(cy-r);y<=Math.ceil(cy+r);y++)for(let x=Math.floor(cx-r);x<=Math.ceil(cx+r);x++) {
        if(x<0||y<0||x>=COLS||y>=ROWS||at(x,y)===terrain.water)continue;
        if((x-cx)**2+(y-cy)**2<=r*r)tiles[y*COLS+x]=type;
      }
    }
    for(const route of routes)for(let p=1;p<route.length;p++) {
      const [ax,ay]=route[p-1], [bx,by]=route[p], length=Math.hypot(bx-ax,by-ay);
      for(let i=0;i<=length*3;i++)disk(ax+(bx-ax)*i/(length*3),ay+(by-ay)*i/(length*3),1.45,terrain.path);
    }
    disk(48,38,5.8,terrain.path);
    disk(48,35,3.1,terrain.stone);
    for(const cy of [38,55])for(let y=cy-1;y<=cy+1;y++)for(let x=61;x<=67;x++)tiles[y*COLS+x]=terrain.bridge;
    // Objetos legados são apenas dados visuais; a máscara define as colisões.
    function add(kind,tx,ty,width,height,extra={}) {
      const object={kind,x:(tx+.5)*TILE,y:(ty+.5)*TILE,width,height,...extra};
      objects.push(object);
      return object;
    }
    add('fountain',48,35,138,100,{footprint:[114,66]});
    add('portal',44,43,140,148,{footprint:[98,32]});
    for(const point of points.filter(p=>p.id!=='portal'&&p.id!=='mountain'))add('sign',point.x,point.y,46,56,{footprint:[24,16],point:point.id});
    // Vila: as portas e as ruas permanecem livres.
    for(const [x,y,color] of [[20,50,'#b96650'],[26,49,'#578a8d'],[31,52,'#aa735d'],[19,57,'#77894b'],[29,58,'#a97696']])add('house',x,y,182,166,{color,footprint:[150,75]});
    add('well',24,57,76,85,{footprint:[56,42]});
    add('house',23,44,230,200,{color:'#7289a0',library:true,footprint:[196,96]});
    // Ruínas: um pátio e colunas separadas por passagens largas.
    for(const [x,y] of [[72,18],[77,17],[82,18],[71,24],[83,24],[72,29],[82,29]])add('column',x,y,60,106,{footprint:[46,36]});
    add('arch',77,20,156,156,{footprint:[136,42]});
    for(const [x,y,shape] of [[74,26,'triangle'],[78,28,'square'],[81,22,'circle']])add('tablet',x,y,66,66,{shape,footprint:[54,40]});
    // Fazenda e moinho. A horta é decorativa e pode ser atravessada.
    add('barn',73,49,228,204,{footprint:[200,110]});
    add('mill',82,49,200,256,{footprint:[104,70]});
    for(const [x,y] of [[73,57],[79,58],[84,55],[85,60]])add('crops',x,y,180,132,{solid:false});
    for(const [x,y] of [[70,58],[82,62],[87,53]])add('hay',x,y,60,50,{footprint:[52,32]});
    // Os paredões ladeiam a subida da montanha, sem fechar a trilha.
    for(const [x,y,w,h] of [[41,18,190,110],[55,18,200,124],[42,14,162,118],[54,13,170,110],[43,9,138,110],[53,8,170,118]])add('cliff',x,y,w,h,{footprint:[w*.82,60]});
    add('cat',48,10,36,45,{solid:false});
    add('rescue',48,10,122,114,{solid:false});
    // Distribuição estável; árvores nunca ocupam estradas ou pontos de interação.
    for(let y=5;y<ROWS-4;y++)for(let x=5;x<COLS-4;x++) {
      if(at(x,y)!==terrain.grass||noise(x,y,4)>(x<36&&y<37?.29:.085))continue;
      if(points.some(p=>Math.hypot(p.x-x,p.y-y)<3.2))continue;
      if(objects.some(o=>Math.abs(o.x/TILE-x)<o.width/TILE/2+1.5&&Math.abs(o.y/TILE-y)<o.height/TILE+1))continue;
      if([[0,0],[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>[terrain.path,terrain.bridge,terrain.stone].includes(at(x+dx,y+dy))))continue;
      const variant=noise(x,y,12);
      add('tree',x+noise(x,y,7)*.35,y,variant>.82?82:120,150,{footprint:[28,23],art:variant>.82?'treeCypress':variant>.30?'treeCanopy':'treeOriginal'});
    }
    for(let i=0;i<80;i++) {
      const x=7+Math.floor(noise(i,8,9)*82),y=6+Math.floor(noise(i,9,10)*59);
      if(at(x,y)!==terrain.grass||points.some(p=>Math.hypot(p.x-x,p.y-y)<3))continue;
      if(objects.some(o=>Math.abs(o.x/TILE-x)<3&&Math.abs(o.y/TILE-y)<3))continue;
      add('rock',x,y,42,28,{footprint:[32,18]});
    }
    // Pequenas composições por lugar: a decoração segue os espaços de uso.
    const props=[
      ['bench',45,36,86,54],['bench',51,36,86,54],
      ['flowerBush',43,34,66,55],['flowerBush',53,34,66,55],
      ['flowerBush',42,41,68,56],['flowerBush',53,44,64,54],
      ['flowers',45.8,43.2,38,32],['flowers',51.4,43.4,38,32],
      ['fern',43.5,42.5,36,30],['flowerBush',42.8,45.2,66,54],
      ['stump',19,26,64,52],['berryBush',25,20,68,56],['fern',18,22,45,36],
      ['flowerBush',23,29,68,56],['stump',15,18,58,48],['berryBush',29,23,68,56],
      ['bench',27,56,80,52],['harvest',18,51,70,62],['flowerBush',32.7,52,66,56],
      ['flowerBush',27.8,49.5,60,52],['flowerBush',21.7,57.4,60,52],['harvest',30.8,58.5,64,58],
      ['berryBush',22,46,68,56],['bench',25,45,78,52],
      ['fern',73,19,42,34],['flowerBush',80.8,20.8,64,52],['rock',80,26,52,38],
      ['fern',75,28,42,34],['flowers',74,23,38,32],
      ['harvest',71,50,70,62],['harvest',80,49,70,62],
      ['fence',72,58.8,110,54],['fence',74.3,58.8,110,54],
      ['fence',83,56.8,110,54],['fence',85.3,56.8,110,54],
      ['flowerBush',80.2,52,64,54],['berryBush',86,49,64,54],
      ['fern',45.6,17,40,34],['fern',51,15,40,34],['flowers',45.8,11.2,36,30]
    ];
    for(const [kind,x,y,w,h] of props) {
      const solid=['bench','stump','harvest','fence','rock'].includes(kind);
      add(kind,x,y,w,h,{solid,footprint:kind==='fence'?[w*.88,12]:[w*.65,Math.min(24,h*.3)]});
    }
    // Clareiras com manchas de flores e folhas, evitando uma grade de enfeites.
    const meadows=[[40,40,7],[54,47,7],[30,37,8],[19,61,6],[78,61,7],[84,33,5]];
    for(let i=0;i<310;i++) {
      const [cx,cy,r]=meadows[i%meadows.length];
      const angle=noise(i,4,20)*Math.PI*2,dist=Math.sqrt(noise(i,6,21))*r;
      const tx=cx+Math.cos(angle)*dist,ty=cy+Math.sin(angle)*dist;
      if(at(Math.floor(tx),Math.floor(ty))!==terrain.grass)continue;
      const wx=(tx+.5)*TILE,wy=(ty+.5)*TILE;
      if(points.some(p=>Math.hypot(p.x-tx,p.y-ty)<1.7))continue;
      if(objects.some(o=>Math.abs(o.x-wx)<(o.width/2+18)&&Math.abs(o.y-wy)<28))continue;
      add(i%3?'fern':'flowers',tx,ty,i%3?32:38,i%3?27:32,{solid:false});
    }
    // O carregamento do JPEG define as dimensões reais; pontos antigos aguardam reposicionamento.
    return {tile:TILE,cols:COLS,rows:ROWS,width:0,height:0,tiles,objects,regions,routes,points:points.map(p=>p.id==='mountain'?{...p,id:'montanha',x:p.image[0]*WORLD_SCALE,y:p.image[1]*WORLD_SCALE,radius:90*WORLD_SCALE}:{...p,x:(p.x+.5)*TILE,y:(p.y+.5)*TILE}),spawn:{x:SPAWN.x*WORLD_SCALE,y:SPAWN.y*WORLD_SCALE},at};
  }
  async function buildCollision(world,map) {
    const mapW=map.naturalWidth,mapH=map.naturalHeight,C=COLLISION_CELL_SIZE;
    const cols=Math.ceil(mapW/C),rows=Math.ceil(mapH/C),n=cols*rows;
    const cells=new Uint8Array(n).fill(1),water=new Uint8Array(n),free=new Uint8Array(n),queue=new Int32Array(n);
    const sample=document.createElement('canvas');sample.width=cols;sample.height=rows;
    const context=sample.getContext('2d',{willReadFrequently:true});
    // Escala por célula: a última linha/coluna pode cobrir uma fração da imagem.
    context.drawImage(map,0,0,mapW/C,mapH/C);
    const rgb=context.getImageData(0,0,cols,rows).data;
    for(let i=0;i<n;i++) {
      // RGB → HSV: V é o maior canal; S é a amplitude/V. H depende do canal máximo.
      const r=rgb[i*4]/255,g=rgb[i*4+1]/255,b=rgb[i*4+2]/255;
      const v=Math.max(r,g,b),d=v-Math.min(r,g,b),s=v?d/v:0;
      const h=d?(60*(v===r?(g-b)/d:v===g?(b-r)/d+2:(r-g)/d+4)+360)%360:0;
      water[i]=h>=WATER_H_MIN&&h<=WATER_H_MAX&&s>=WATER_S_MIN&&v>=WATER_V_MIN?1:0;
    }
    sample.width=sample.height=0;
    function neighbors(i,visit) {
      if(i>=cols)visit(i-cols);if(i+cols<n)visit(i+cols);
      if(i%cols)visit(i-1);if(i%cols<cols-1)visit(i+1);
    }
    function flood(field,start,seen) {
      if(!field[start])return 0;
      let head=0,tail=1;queue[0]=start;seen[start]=1;
      while(head<tail)neighbors(queue[head++],j=>{if(field[j]&&!seen[j]){seen[j]=1;queue[tail++]=j;}});
      return tail;
    }
    const seenWater=new Uint8Array(n);
    for(let i=0;i<n;i++)if(water[i]&&!seenWater[i]) {
      const count=flood(water,i,seenWater);
      if(count<WATER_MIN_COMPONENT_CELLS)for(let j=0;j<count;j++)water[queue[j]]=0;
    }
    // Dilatação em oito direções (distância de Chebyshev), feita só no carregamento.
    const distance=new Uint16Array(n).fill(65535);let head=0,tail=0;
    for(let i=0;i<n;i++)if(WATER_AUTO_ENABLED&&water[i]){distance[i]=0;queue[tail++]=i;cells[i]=0;}
    while(head<tail) {
      const i=queue[head++],x=i%cols,y=Math.floor(i/cols);
      if(distance[i]>=WATER_MARGIN_CELLS)continue;
      for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++) {
        const nx=x+dx,ny=y+dy,j=ny*cols+nx;
        if(nx>=0&&nx<cols&&ny>=0&&ny<rows&&distance[j]===65535) {
          distance[j]=distance[i]+1;cells[j]=0;queue[tail++]=j;
        }
      }
    }
    function loadMask(src) {return new Promise(resolve=>{
      const image=new Image();image.onload=()=>resolve(image);
      image.onerror=()=>resolve(null);image.src=src;
    });}
    let mask=await loadMask(HITBOX_MASK_SRC);
    if(!mask) {
      console.warn('[Colisão] island_hitbox.png ausente: usando island_mask.png antigo.');
      mask=await loadMask('assets/ilha/island_mask.png');
      if(!mask)console.warn('[Colisão] Máscara antiga ausente: usando somente água automática.');
    }
    if(mask) {
      const maskW=mask.naturalWidth,maskH=mask.naturalHeight,canvas=document.createElement('canvas');
      canvas.width=maskW;canvas.height=maskH;
      try {
        const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(mask,0,0);
        let rgba=ctx.getImageData(0,0,maskW,maskH).data; // Uma única leitura da máscara original.
        const sx=maskW/mapW,sy=maskH/mapH;
        for(let gy=0;gy<rows;gy++)for(let gx=0;gx<cols;gx++) {
          // Célula de 4 px do mapa → todos os pixels sobrepostos da máscara.
          // floor/ceil conservam até a linha fina que atravessa a quina entre células.
          const x0=Math.floor(gx*C*sx),x1=Math.min(maskW,Math.ceil((gx+1)*C*sx));
          const y0=Math.floor(gy*C*sy),y1=Math.min(maskH,Math.ceil((gy+1)*C*sy)),i=gy*cols+gx;
          let red=0;
          for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++) {
            const p=(y*maskW+x)*4;if(rgba[p+3]<MASK_ALPHA_MIN)continue;
            const r=rgba[p],g=rgba[p+1],b=rgba[p+2];
            if(r>200&&g<80&&b<80)red++;
            if(g>150&&r<120&&b<120)free[i]=1; // Verde antigo continua sempre livre.
          }
          if(red>=HITBOX_CELL_MIN_PIXELS)cells[i]=0;
        }
        rgba=null; // A grade é suficiente daqui em diante; libera os pixels da máscara.
      } finally {canvas.width=canvas.height=0;}
    }
    // Verde vence inclusive a água dilatada; áreas transparentes mantêm a regra anterior.
    for(let i=0;i<n;i++)if(free[i])cells[i]=1;
    const overlay=document.createElement('canvas');overlay.width=cols;overlay.height=rows;
    const overlayCtx=overlay.getContext('2d'),pixels=overlayCtx.createImageData(cols,rows);
    for(let i=0;i<n;i++)if(WATER_AUTO_ENABLED&&distance[i]<=WATER_MARGIN_CELLS&&!free[i]) {
      pixels.data[i*4+1]=100;pixels.data[i*4+2]=255;pixels.data[i*4+3]=112;
    }
    overlayCtx.putImageData(pixels,0,0);
    world.collision={cells,free,cols,rows,mapW,mapH,overlay,mask,maskScaleX:mask?mask.naturalWidth/mapW:1,maskScaleY:mask?mask.naturalHeight/mapH:1};
    function adjust(point,feet=false,downOnly=false) {
      const gx=Math.floor(point.x/C),gy=Math.floor(point.y/C);
      const valid=(x,y)=>x>=0&&x<cols&&y>=0&&y<rows&&cells[y*cols+x]&&(!feet||isWalkable(world,(x*C+C/2)*WORLD_SCALE,(y*C+C/2)*WORLD_SCALE));
      if(valid(gx,gy)&&(!feet||isWalkable(world,point.x*WORLD_SCALE,point.y*WORLD_SCALE)))return {...point};
      if(downOnly) {
        // Procura a menor distância no semiplano abaixo do pedido; nunca nasce acima dele.
        // Empates favorecem descer, antes de deslocar para os lados.
        let best=null,dist=Infinity;
        for(let y=gy;y<rows;y++) {
          const py=y*C+C/2,dy=py-point.y;if(dy<0)continue;if(dy*dy>dist)break;
          for(let x=0;x<cols;x++) {
            const px=x*C+C/2,d=(px-point.x)**2+dy*dy;
            if(d>dist||!valid(x,y))continue;
            if(d<dist||!best||py>best.y){dist=d;best={...point,x:px,y:py};}
          }
        }
        if(best)return best;
        throw new Error('[Colisão] Não há spawn andável abaixo do ponto pedido.');
      }
      // Anéis quadrados em espiral; escolhe o centro mais próximo no primeiro anel livre.
      for(let radius=1;radius<=Math.max(cols,rows);radius++) {
        let best=null,dist=Infinity;
        for(let offset=-radius;offset<=radius;offset++)for(const [x,y] of [
          [gx+offset,gy-radius],[gx+offset,gy+radius],[gx-radius,gy+offset],[gx+radius,gy+offset]
        ]) {
          if(!valid(x,y))continue;
          const d=(x*C+C/2-point.x)**2+(y*C+C/2-point.y)**2;
          if(d<dist){dist=d;best={...point,x:x*C+C/2,y:y*C+C/2};}
        }
        if(best){console.warn(`[Colisão] ${point.name}: (${point.x}, ${point.y}) → (${best.x}, ${best.y}).`);return best;}
      }
      throw new Error('[Colisão] Não há célula andável para '+point.name);
    }
    const spawn=adjust({...SPAWN_POINT,name:'SPAWN'},true,true);
    console.info(`spawn pedido (${SPAWN_POINT.x},${SPAWN_POINT.y}) -> spawn real (${spawn.x},${spawn.y})`);
    world.spawn.x=spawn.x*WORLD_SCALE;world.spawn.y=spawn.y*WORLD_SCALE;world.spawnPending=true;
    world.checkpoints=CHECKPOINTS.map(point=>adjust(point,true));
    const seen=new Uint8Array(n),start=Math.floor(spawn.y/C)*cols+Math.floor(spawn.x/C);
    const reached=flood(cells,start,seen),total=cells.reduce((sum,value)=>sum+value,0);
    window.IslandKeys?.place(world,seen);
    const keyUnreachable=(world.mapKeys||[]).filter(p=>p.reachableDistance>INTERACT_RADIUS/WORLD_SCALE);
    (keyUnreachable.length?console.warn:console.info)('[Chaves] BFS do spawn — INALCANÇÁVEIS:',keyUnreachable.length?keyUnreachable.map(p=>p.label):'nenhuma');
    const unreachable=world.checkpoints.filter(p=>!seen[Math.floor(p.y/C)*cols+Math.floor(p.x/C)]);
    const isolated=[];
    for(let i=0;i<n;i++)if(cells[i]&&!seen[i]) {
      const count=flood(cells,i,seen);
      if(count>500)isolated.push({cells:count,x:(i%cols)*C+C/2,y:Math.floor(i/cols)*C+C/2});
    }
    world.collision.report={unreachable,keyUnreachable,reachablePercent:100*reached/total,isolated};
    console.info('[Colisão] Checkpoints INALCANÇÁVEIS:',unreachable.length?unreachable.map(p=>p.name):'nenhum');
    console.info(`[Colisão] Células andáveis alcançáveis: ${(100*reached/total).toFixed(2)}%.`);
    console.info('[Colisão] Regiões isoladas com mais de 500 células (exemplos em px da imagem):',isolated);
    // Diagnóstico adicional: conexões de uma célula podem não comportar a pegada inteira.
    const footCells=cells.map((value,i)=>value&&isWalkable(world,(i%cols*C+C/2)*WORLD_SCALE,(Math.floor(i/cols)*C+C/2)*WORLD_SCALE)?1:0);
    const footSeen=new Uint8Array(n),reachableCount=flood(footCells,start,footSeen);
    world.collision.report.footUnreachable=world.checkpoints.filter(p=>!footSeen[Math.floor(p.y/C)*cols+Math.floor(p.x/C)]);
    if(world.collision.report.footUnreachable.length)console.warn('[Colisão] Acessos estreitos para a pegada:',world.collision.report.footUnreachable.map(p=>p.name));
    // BFS usa isWalkable, a mesma consulta de pegada usada por movePlayer.
    // Distâncias dos alvos são medidas em mundo; suas coordenadas ficam em pixels do mapa.
    const targets=[{name:'Geometria',x:1944,y:362},{name:'Lógica',x:631,y:592},
      {name:'Álgebra',x:715,y:952},{name:'Operações',x:2226,y:922},{name:'Cela',x:1288,y:478}];
    let leak=false;
    for(let i=0;i<n;i++)if(footSeen[i]) {
      const x=i%cols,y=Math.floor(i/cols);
      if(!x||!y||x===cols-1||y===rows-1||water[i])leak=true;
    }
    for(const target of targets) {
      let nearest=Infinity;
      for(let i=0;i<n;i++)if(footSeen[i]) {
        const dx=((i%cols)*C+C/2-target.x)*WORLD_SCALE;
        const dy=(Math.floor(i/cols)*C+C/2-target.y)*WORLD_SCALE;
        nearest=Math.min(nearest,dx*dx+dy*dy);
      }
      target.distance=Math.sqrt(nearest);target.reachable=target.distance<=INTERACT_RADIUS;
      console.info(`[Hitbox] ${target.name}: ${target.reachable?'OK':'FALHA'} (distância ${target.distance.toFixed(1)} de mundo; raio ${INTERACT_RADIUS}).`);
    }
    Object.assign(world.collision.report,{reachableCount,leak,targets});
    console.info(`[Hitbox] BFS dos pés a partir de (${spawn.x}, ${spawn.y}): ${reachableCount} células alcançáveis.`);
    (leak?console.warn:console.info)(`[Hitbox] ${leak?'VAZAMENTO':'OK: sem vazamento'} para borda/água.`);
  }
  function cellAt(world,x,y) {
    // Mundo → imagem → célula: a câmera projeta esse mesmo mundo, sem alterar a física.
    // Desfazer WORLD_SCALE basta; aplicar CAMERA_ZOOM aqui deslocaria a máscara ao dar zoom.
    const c=world.collision;if(!c||x<0||y<0||x>=world.width||y>=world.height)return false;
    const gx=Math.floor(x/WORLD_SCALE/COLLISION_CELL_SIZE),gy=Math.floor(y/WORLD_SCALE/COLLISION_CELL_SIZE);
    return c.cells[gy*c.cols+gx]===1;
  }
  function isWalkable(world,x,y) {
    // (x,y) ancora os pés; a pegada ocupa FOOT_H pixels acima da base do sprite.
    return cellAt(world,x-FOOT_W/2,y-FOOT_H)&&cellAt(world,x+FOOT_W/2,y-FOOT_H)&&cellAt(world,x-FOOT_W/2,y)&&cellAt(world,x+FOOT_W/2,y);
  }
  function movePlayer(world,position,dx,dy) {
    if(world.spawnPending){Object.assign(position,world.spawn);world.spawnPending=false;}
    const steps=Math.max(1,Math.ceil(Math.max(Math.abs(dx),Math.abs(dy))/(COLLISION_CELL_SIZE*WORLD_SCALE/2)));
    const sx=dx/steps,sy=dy/steps;let nudged=false;
    for(let i=0;i<steps;i++) {
      const oldX=position.x,oldY=position.y;
      // X e depois Y permitem deslizar na parede. Subpassos evitam saltar células finas.
      if(isWalkable(world,position.x+sx,position.y))position.x+=sx;
      if(isWalkable(world,position.x,position.y+sy))position.y+=sy;
      if(nudged||(!sx&&!sy)||position.x!==oldX||position.y!==oldY)continue;
      // Cantos de máscara pintada à mão podem prender os pés: busque uma saída lateral curta.
      const horizontal=Math.abs(sx)>=Math.abs(sy);
      for(const sign of [1,-1]) {
        for(let offset=1;offset<=CORNER_NUDGE;offset++) {
          const x=oldX+(horizontal?0:offset*sign),y=oldY+(horizontal?offset*sign:0);
          if(!isWalkable(world,x,y))break; // Não salta uma célula bloqueada no ajuste.
          if(!isWalkable(world,x+sx,y+sy))continue; // Só ajusta se liberar a caminhada.
          position.x=x;position.y=y;nudged=true;break;
        }
        if(nudged)break; // No máximo 3 px laterais por movimento, mesmo com subpassos.
      }
    }
  }
  return {create,terrain,noise,regionAt,buildCollision,cellAt,isWalkable,movePlayer};
})();

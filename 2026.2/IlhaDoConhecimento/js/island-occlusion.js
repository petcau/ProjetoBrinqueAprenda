/* Toda tinta rosa é uma camada à frente da personagem, sem filtro pela posição dos pés. */
window.IslandOcclusion = (() => {
  'use strict';
  async function create(map) {
    const mask=await new Promise(resolve=>{
      const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>resolve(null);
      image.src=OCCLUSION_MASK_SRC;
    });
    if(!mask){console.warn('[Oclusão] island_occlusion.png ausente: sem oclusão.');return null;}
    const W=map.naturalWidth,H=map.naturalHeight,n=W*H,occ=new Uint8Array(n);
    const source=document.createElement('canvas');source.width=mask.naturalWidth;source.height=mask.naturalHeight;
    const sourceCtx=source.getContext('2d',{willReadFrequently:true});sourceCtx.drawImage(mask,0,0);
    let rgba=sourceCtx.getImageData(0,0,source.width,source.height).data;
    const sx=source.width/W,sy=source.height/H;let pixels=0;
    // Vizinho mais próximo: a máscara pode ter dimensões diferentes do mapa.
    for(let y=0;y<H;y++)for(let x=0;x<W;x++) {
      const i=y*W+x,p=(Math.floor(y*sy)*source.width+Math.floor(x*sx))*4;
      if(rgba[p+3]>=OCCLUSION_ALPHA_MIN&&rgba[p]>200&&rgba[p+2]>200&&rgba[p+1]<80){occ[i]=1;pixels++;}
    }
    rgba=null;source.width=source.height=0;
    const backgroundCanvas=document.createElement('canvas');backgroundCanvas.width=W;backgroundCanvas.height=H;
    const mapCtx=backgroundCanvas.getContext('2d',{willReadFrequently:true});mapCtx.drawImage(map,0,0);
    const mapPixels=new Uint32Array(mapCtx.getImageData(0,0,W,H).data.buffer);
    const foregroundCanvas=document.createElement('canvas');foregroundCanvas.width=W;foregroundCanvas.height=H;
    const frontCtx=foregroundCanvas.getContext('2d'),frontData=frontCtx.createImageData(W,H);
    const frontPixels=new Uint32Array(frontData.data.buffer);
    const overlay=document.createElement('canvas');overlay.width=W;overlay.height=H;
    const overlayCtx=overlay.getContext('2d'),overlayData=overlayCtx.createImageData(W,H);
    let covered=0;
    for(let i=0;i<n;i++)if(occ[i]) {
      frontPixels[i]=mapPixels[i];if(frontData.data[i*4+3])covered++;
      overlayData.data[i*4]=255;overlayData.data[i*4+2]=255;overlayData.data[i*4+3]=90;
    }
    frontCtx.putImageData(frontData,0,0);overlayCtx.putImageData(overlayData,0,0);
    const report={pixels,covered,selfTest:pixels>0&&covered===pixels};
    console.info('[Oclusão] Toda a tinta rosa: cobertura '+covered+'/'+pixels+' pixels — '+(report.selfTest?'OK':'FALHA')+'.');
    const fw=HERO_SHEET.frameW,fh=HERO_SHEET.frameH,k=HERO_SCALE/WORLD_SCALE;
    let heroAlpha=null,diagonalAlpha=null,sheetW=0,diagonalW=0,lastX=NaN,lastY=NaN,lastFrame=-1,behind=false;
    function setHero(image,diagonalImage) {
      for(const [index,sheet] of [image,diagonalImage].entries()) {
        if(!sheet?.naturalWidth)continue;
        source.width=sheet.naturalWidth;source.height=sheet.naturalHeight;
        sourceCtx.drawImage(sheet,0,0);
        const data=sourceCtx.getImageData(0,0,source.width,source.height).data;
        const alpha=new Uint8Array(source.width*source.height);
        for(let i=0;i<alpha.length;i++)alpha[i]=data[i*4+3];
        if(index===0){heroAlpha=alpha;sheetW=source.width;}
        else {diagonalAlpha=alpha;diagonalW=source.width;}
      }
      source.width=source.height=0;lastX=NaN;
    }
    function update(heroX,footY,column=8,row=0) {
      const frame=row*10+column;if(heroX===lastX&&footY===lastY&&frame===lastFrame)return;
      lastX=heroX;lastY=footY;lastFrame=frame;behind=false;
      // Direções 4–7 usam as linhas 0–3 da folha diagonal; fallback igual ao desenho.
      const diagonal=row>=4&&diagonalAlpha,alpha=diagonal?diagonalAlpha:heroAlpha;
      const width=diagonal?diagonalW:sheetW;
      const spriteRow=row>=4?(diagonal?row-4:(row===4||row===6?1:2)):row;
      // Só há fantasma se a tinta realmente interceptar um pixel visível do quadro atual.
      // Uma árvore vizinha dentro do antigo patch não deve mudar a aparência da personagem.
      for(let fy=0;fy<fh;fy++)for(let fx=0;fx<fw;fx++) {
        if(alpha&&!alpha[(spriteRow*fh+fy)*width+column*fw+fx])continue;
        const left=heroX+(fx-HERO_SHEET.pivotX)*k,top=footY+(fy-HERO_SHEET.pivotY)*k;
        // Uma posição fracionária pode sobrepor dois pixels do mapa; testar os dois evita falhas.
        const x0=Math.max(0,Math.floor(left)),x1=Math.min(W,Math.ceil(left+k));
        const y0=Math.max(0,Math.floor(top)),y1=Math.min(H,Math.ceil(top+k));
        for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++)if(occ[y*W+x]){behind=true;return;}
      }
    }
    function draw(ctx,camX=0,camY=0,vw=W*WORLD_SCALE,vh=H*WORLD_SCALE) {
      if(!behind||vw<=0||vh<=0)return;
      ctx.save();ctx.imageSmoothingEnabled=false;
      // A camada inteira está pronta, mas só precisa ser composta sobre a área do sprite.
      // A folga protege a suavização do contorno quando a personagem está entre pixels.
      ctx.beginPath();ctx.rect((lastX-HERO_SHEET.pivotX*k)*WORLD_SCALE-2,
        (lastY-HERO_SHEET.pivotY*k)*WORLD_SCALE-2,fw*k*WORLD_SCALE+4,fh*k*WORLD_SCALE+4);ctx.clip();
      // M sobre (personagem sobre M), com alfa 0,7, deixa só a parte coberta em 30%.
      // É equivalente ao fantasma, sem redesenhar nem escurecer a parte fora da máscara.
      ctx.globalAlpha=1-Math.max(0,Math.min(1,OCCLUSION_GHOST_ALPHA));
      // Mesma origem, recorte e destino do mapa. As duas fontes são canvases nativos,
      // evitando costuras de amostragem entre o JPEG e um pequeno patch recortado.
      ctx.drawImage(foregroundCanvas,camX/WORLD_SCALE,camY/WORLD_SCALE,vw/WORLD_SCALE,vh/WORLD_SCALE,camX,camY,vw,vh);
      ctx.restore();
    }
    return {occ,report,backgroundCanvas,foregroundCanvas,overlay,setHero,update,draw,get behind(){return behind;}};
  }
  return {create};
})();

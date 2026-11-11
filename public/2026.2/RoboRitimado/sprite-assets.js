(() => {
  'use strict';
  const cache=new Map();
  function load(url){
    if(cache.has(url))return cache.get(url);
    const image=new Image();image.decoding='async';
    const ready=new Promise((resolve,reject)=>{
      image.onload=async()=>{try{await image.decode();if(!image.naturalWidth||!image.naturalHeight)throw Error('Imagem vazia');resolve(image);}catch(error){reject(Error('Não foi possível preparar a imagem '+url+': '+error.message));}};
      image.onerror=()=>reject(Error('Não foi possível carregar '+url+'. Extraia a pasta completa do jogo.'));
    });
    ready.catch(()=>{});image.src=url;
    const asset={image,ready};cache.set(url,asset);return asset;
  }
  const cells=(w=384,h=512)=>Array.from({length:8},(_,i)=>[(i%4)*w,Math.floor(i/4)*h,w,h]);
  function validate(image,frames){
    if(!image.complete||!image.naturalWidth)throw Error('Personagem ainda está carregando.');
    for(const [x,y,w,h] of frames)if(x<0||y<0||w<=0||h<=0||x+w>image.naturalWidth||y+h>image.naturalHeight)throw Error('Uma pose está fora dos limites da imagem.');
    return true;
  }
  // Source polygons isolate adjacent silhouettes in the illustrated story sheet.
  // They are renderer clip paths, not modifications to the source PNG.
  const story=[
    {r:[0,58,445,455],clip:[[0,0],[445,0],[445,210],[419,272],[405,350],[380,455],[0,455]]},
    {r:[392,137,460,376],clip:[[135,0],[386,0],[401,139],[388,275],[460,329],[460,376],[0,376],[0,272],[79,184],[125,110]]},
    {r:[801,43,377,467],clip:[[0,0],[377,0],[377,467],[53,467],[53,383],[0,358]]},
    {r:[1178,0,358,519]},
    {r:[0,588,426,421],clip:[[0,0],[426,0],[426,222],[390,280],[385,421],[0,421]]},
    {r:[393,582,387,433],clip:[[63,0],[387,0],[387,433],[0,433],[0,278],[61,185]]},
    {r:[787,512,371,512]},
    {r:[1157,512,379,512]}
  ];
  function draw(context,image,frame,x,floor,height,options={}){
    const entry=Array.isArray(frame)?{r:frame}:frame;
    const [sx,sy,sw,sh]=entry.r,scale=height/(options.referenceHeight||520);
    context.save();context.globalAlpha=options.alpha??1;context.translate(x,floor);context.rotate(options.rotation||0);
    context.scale((options.flip?-1:1)*scale,scale);
    if(entry.clip){context.beginPath();entry.clip.forEach(([px,py],i)=>i?context.lineTo(px-sw/2,py-sh):context.moveTo(px-sw/2,py-sh));context.closePath();context.clip();}
    context.drawImage(image,sx,sy,sw,sh,-sw/2,-sh,sw,sh);context.restore();
  }
  window.RR_SPRITES=Object.freeze({load,cells,validate,draw,story,
    standard:[[0,0,418,526],[427,0,367,518],[797,0,366,519],[1166,0,370,520],[0,533,445,480],[448,520,340,494],[790,533,369,480],[1160,559,376,451]]});
})();

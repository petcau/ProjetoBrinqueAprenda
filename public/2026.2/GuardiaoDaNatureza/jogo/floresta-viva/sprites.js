'use strict';
(() => {
  const atlas=window.GuardiaoFlorestaAtlas,base=new URL("./",document.currentScript.src);
  class Sprites {
    constructor(){this.images=new Map();}
    async load(onProgress=()=>{},names=Object.keys(atlas.sheets)){await Promise.all(Object.entries(atlas.sheets).filter(([id])=>names.includes(id)).map(async([id,s])=>{const image=new Image();const url=new URL('assets/'+s.file,base).href;image.src=window.GuardiaoArte?.url(url)||url;await image.decode();if(image.naturalWidth!==s.width||image.naturalHeight!==s.height)throw Error('Prancha inválida: '+id);this.images.set(id,image);onProgress();}));return this;}
    draw(ctx,name,index,x,y,height,{flip=false,angle=0,alpha=1,anchor='feet',width=null}={}){
      const sheet=atlas.sheets[name],f=sheet.frames[index%sheet.frames.length],[sx,sy,sw,sh]=f.bounds;
      const scale=height/sheet.referenceHeight;
      ctx.save();ctx.globalAlpha*=alpha;ctx.translate(x,y);ctx.rotate(angle);if(flip)ctx.scale(-1,1);
      if(anchor==='center')ctx.drawImage(this.images.get(name),sx,sy,sw,sh,-(width??sw*scale)/2,-height/2,width??sw*scale,height);
      else ctx.drawImage(this.images.get(name),sx,sy,sw,sh,(sx-f.pivot[0])*scale,(sy-f.pivot[1])*scale,sw*scale,sh*scale);
      ctx.restore();
    }
    // Horário: E, NE, N, NO, O, SO, S, SE. SO usa espelhamento corrigindo a arte.
    hose(ctx,direction,frame,x,y,height,options={}){const index=direction*2+frame;this.draw(ctx,'kai-mangueira',index,x,y,height,{...options,flip:direction===5});}
    item(ctx,id,x,y,size,options={}){this.draw(ctx,'itens',id,x,y,size,{anchor:'center',...options});}
    jet(ctx,index,from,to,time){
      const dx=to.x-from.x,dy=to.y-from.y,length=Math.hypot(dx,dy);if(length<1)return;
      const f=atlas.sheets.itens.frames[4+index%4],[sx,sy,sw,sh]=f.bounds;
      ctx.save();ctx.translate(from.x,from.y);ctx.rotate(Math.atan2(dy,dx));ctx.globalAlpha=.94;
      ctx.drawImage(this.images.get('itens'),sx,sy,sw,sh,0,-9,length,18+Math.sin(time*14)*2);ctx.restore();
    }
  }
  window.FlorestaSprites=Sprites;
})();

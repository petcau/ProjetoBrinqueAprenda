'use strict';
(() => {
  class Ambiente {
    constructor(sprites,burned,healthy,fire){this.sprites=sprites;this.burned=burned;this.healthy=healthy;this.fire=fire;this.lastRecovery=0;this.leavesEnabled=true;try{this.leavesEnabled=JSON.parse(localStorage.getItem('guardiao.horizonte.preferences.v1')||'{}').fallingLeaves!==false;}catch{}}
    ground(ctx,fires,time,reduced,completed=false){
      ctx.drawImage(this.burned,0,0,1280,720);
      if(this.life)this.life.restore(ctx,this.healthy,fires.filter(f=>f.life<=0),time,reduced);
      else for(const f of fires){
        if(f.life>0)continue;
        const progress=reduced?1:Math.min(1,(time-(f.restoredAt??-5))/3);
        // Máscara progressiva: a recuperação fica limitada à área do objetivo.
        ctx.save();ctx.beginPath();ctx.ellipse(f.x,f.y-15,f.rx*progress,f.ry*progress,0,0,Math.PI*2);ctx.clip();
        ctx.globalAlpha=progress;ctx.drawImage(this.healthy,0,0,1280,720);ctx.restore();
      }
      this.life?.rebirth?.full(ctx,this.healthy,reduced,completed);
      this.water(ctx,time,reduced);
      if(!reduced&&this.leavesEnabled)this.leaves(ctx,time);
    }
    water(ctx,time,reduced){
      if(reduced)return;
      ctx.save();ctx.strokeStyle='#d5fbffa0';ctx.lineWidth=1.5;
      const trace=[[510,20],[535,130],[541,220],[552,300],[570,390],[596,490],[625,600],[680,710]];
      for(let j=0;j<30;j++){
        const t=(time*.16+j/30)%1,i=Math.min(6,Math.floor(t*7)),f=t*7-i;
        const x=trace[i][0]+(trace[i+1][0]-trace[i][0])*f+Math.sin(j*3)*12,y=trace[i][1]+(trace[i+1][1]-trace[i][1])*f;
        ctx.globalAlpha=Math.sin(t*Math.PI)*.55;ctx.beginPath();ctx.moveTo(x-4,y);ctx.lineTo(x+4,y+3);ctx.stroke();
      }ctx.restore();
    }
    leaves(ctx,time){
      ctx.save();const ashen=this.life?.rebirth&&!this.life.rebirth.objectives.length&&!this.life.rebirth.complete;
      for(let j=0;j<21;j++){
        const t=(time*.035+j*.071)%1,x=(j*193+Math.sin(t*8+j)*50+time*8)%1340-30,y=t*760-30;
        if(ashen)this.life.rebirth.ashLeaf(ctx,x,y,8+j%3*2,time*.6+j);else this.sprites.draw(ctx,'natureza',4+j%2,x,y,8+j%3*2,{anchor:'center',angle:time*.6+j,alpha:.65});
      }
      ctx.restore();
    }
    tree(ctx,tree,time,reduced){
      ctx.save();ctx.translate(tree.x,tree.y);ctx.rotate(reduced?0:Math.sin(time*.85+tree.x)*.009);
      ctx.globalAlpha=this.life?.treeOpacity(tree,time,reduced)??1;
      const growth=this.life?.rebirth?.recovery(tree,time,reduced)??1;if(growth<1){ctx.save();ctx.globalAlpha*=1-growth;this.life?.rebirth?.drawDead(ctx,tree);ctx.restore();}if(growth>0){ctx.globalAlpha*=growth;this.sprites.draw(ctx,'natureza',tree.frame,0,0,tree.h);}ctx.restore();
    }
    flame(ctx,f,time,reduced){
      if(f.life<=0){
        const t=reduced?1:Math.min(1,(time-(f.restoredAt??-4))/3);
        this.sprites.draw(ctx,'natureza',2,f.x,f.y+2,34*t);this.sprites.draw(ctx,'natureza',6,f.x+25,f.y+12,17*t);return;
      }
      if(this.life){this.life.fire(ctx,f,time,reduced);return;}
      const pose=reduced?0:(Math.floor(time*10)+f.id*3)%8,h=96*(.5+f.life*.5);
      this.sprites.draw(ctx,'fogo',pose,f.x,f.y,h);
      if(!reduced){for(let j=0;j<3;j++){const t=(time*.33+j*.33+f.id*.1)%1;ctx.fillStyle=`rgba(65,57,48,${(1-t)*.17})`;ctx.beginPath();ctx.ellipse(f.x+Math.sin(j+time)*9,f.y-30-t*60,7+t*10,9+t*7,0,0,Math.PI*2);ctx.fill();}}
    }
    celebrate(ctx,player,time,reduced){
      if(reduced)return;
      for(let j=0;j<30;j++){const t=(time*.23+j/30)%1,angle=j*2.4+time*.13;const x=player.x+Math.cos(angle)*(30+t*130),y=player.y-60+Math.sin(angle)*(15+t*65)-t*40;this.sprites.draw(ctx,'natureza',4+j%2,x,y,8,{anchor:'center',angle:angle,alpha:1-t});}
    }
  }
  window.FlorestaAmbiente=Ambiente;
})();

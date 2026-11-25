(() => {'use strict';
  function paintArrow(ctx,x,y,lane,size,color,filled,{soft=false,contrast=false,theme='doces'}={}) {
    ctx.save(); ctx.translate(x, y);
    ctx.rotate([Math.PI, Math.PI / 2, -Math.PI / 2, 0][lane]);
    ctx.beginPath();
    const path = [[-.44, -.23], [.03, -.23], [.03, -.46], [.49, 0], [.03, .46], [.03, .23], [-.44, .23]];
    path.forEach(([px, py], i) => i ? ctx.lineTo(px * size, py * size) : ctx.moveTo(px * size, py * size));
    ctx.closePath(); ctx.lineJoin = 'round'; ctx.lineWidth = filled ? 2 : 2.5;
    ctx.shadowColor = color; ctx.shadowBlur = soft?0:filled?12:5;
    const fill = ctx.createLinearGradient(-size / 2, -size / 2, size / 2, size / 2);
    fill.addColorStop(0, '#fff7f6'); fill.addColorStop(.35, color); fill.addColorStop(1, color + 'aa');
    ctx.fillStyle = filled ? (contrast ? color : fill) : (contrast ? '#000000' : '#19152ed9'); ctx.fill(); ctx.strokeStyle = filled ? '#fff3ffdd' : color; ctx.stroke();
    if (filled && !soft && !contrast) {
      ctx.save(); ctx.clip(); ctx.shadowBlur = 0;
      if (theme!=='doces') {
        ctx.fillStyle = '#ffffffb0';
        if(theme==='pantano'){ctx.beginPath();ctx.ellipse(0,0,size*.07,size*.14,.55,0,Math.PI*2);ctx.fill();}
        else if(theme==='deserto'){for(let a=0;a<8;a++){ctx.save();ctx.rotate(a*Math.PI/4);ctx.fillRect(-1,size*.07,2,size*.07);ctx.restore();}ctx.beginPath();ctx.arc(0,0,size*.055,0,Math.PI*2);ctx.fill();}
        else if(theme==='gelo'){for(let a=0;a<6;a++){ctx.save();ctx.rotate(a*Math.PI/3);ctx.fillRect(-1,-size*.15,2,size*.3);ctx.restore();}}
        else if(theme==='ceu'){ctx.beginPath();[[0,-.16],[.04,-.04],[.16,0],[.04,.04],[0,.16],[-.04,.04],[-.16,0],[-.04,-.04]].forEach(([x,y],i)=>i?ctx.lineTo(x*size,y*size):ctx.moveTo(x*size,y*size));ctx.closePath();ctx.fill();}
        else{ctx.beginPath();for(let i=0;i<8;i++){const a=i*Math.PI/4,r=size*(i%2?.04:.12);i?ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r):ctx.moveTo(Math.cos(a)*r,Math.sin(a)*r);}ctx.closePath();ctx.fill();}
        ctx.fillStyle = '#ffffff75';
        for (const dx of [-.3, -.15]) { ctx.beginPath(); ctx.arc(dx * size, 0, size * .035, 0, Math.PI * 2); ctx.fill(); }
      } else {
        ctx.strokeStyle = '#ffffff85'; ctx.lineWidth = 3;
        const shift = 4;
        for (let sx = -size; sx < size; sx += 15) { ctx.beginPath(); ctx.moveTo(sx + shift, -size); ctx.lineTo(sx + size + shift, size); ctx.stroke(); }
      }
      ctx.restore();
      ctx.shadowBlur = 0; ctx.globalAlpha = .45; ctx.translate(-size * .035, -size * .045);
      ctx.scale(.72, .7); ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5;
      // Canvas paths are not restored by save/restore: rebuild the arrow after
      // drawing the clipped stripes/star so decorative paths cannot leak out.
      ctx.beginPath();
      path.forEach(([px, py], i) => i ? ctx.lineTo(px * size, py * size) : ctx.moveTo(px * size, py * size));
      ctx.closePath(); ctx.stroke();
    }
    ctx.restore();
  }

window.RR_ARROWS=Object.freeze({draw:paintArrow});})();

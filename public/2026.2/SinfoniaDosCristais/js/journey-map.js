(() => {
 const coordinates=[
   [20.6,26.8], // 1: Caverna (pedra topo-esquerda)
   [27.5,25.5], // 2: Caverna (anel roxo)
   [32.6,34.5], // 3: Caverna (pedra junto ao cristal da fada)
   [38.7,39.5], // 4: Caverna/Floresta (pedra acima da porta)
   [50.5,39.5], // 5: Floresta (pedra trilha superior)
   [56.5,39.5], // 6: Floresta (pedra antes da curva)
   [58.0,51.5], // 7: Floresta (pedra descida vertical)
   [62.5,56.9], // 8: Floresta (pedra curva inferior)
   [66.9,47.0], // 9: Floresta/Rio (pedra abaixo cristal ciano)
   [66.9,31.0], // 10: Rio (pedra antes da ponte de madeira)
   [67.0,17.0], // 11: Rio (pedra canto superior da ponte de pedra)
   [73.6,15.9], // 12: Rio (pedra meio da ponte de pedra)
   [79.2,15.9], // 13: Rio (pedra canto direito da ponte de pedra)
   [82.5,22.8], // 14: Rio (pedra na ponte de madeira da direita)
   [82.8,37.7], // 15: Caatinga (pedra logo após a ponte)
   [83.0,52.1], // 16: Caatinga (pedra na descida sul)
   [70.8,62.5], // 17: Caatinga (anel roxo / rosa)
   [69.9,73.5], // 18: Caatinga (pedra cinza na curva)
   [59.2,78.2], // 19: Caatinga (pedra dourada em frente ao Citrino - Fase 19)
   [47.8,78.2], // 20: Caatinga (sala do minigame final - Fase 20: O Desafio das Areias)
   [32.3,60.4]  // 21: Porta Ancestral (pedestal azul ciano)
 ];
 const finalPedestal=coordinates[20];
 const route=[
   coordinates[0],
   coordinates[1],
   coordinates[2],
   [32.6,39.5],
   coordinates[3],
   [44.0,39.5],
   coordinates[4],
   coordinates[5],
   coordinates[6],
   coordinates[7],
   [66.9,53.0],
   coordinates[8],
   coordinates[9],
   coordinates[10],
   coordinates[11],
   coordinates[12],
   coordinates[13],
   coordinates[14],
   coordinates[15],
   [77.7,62.5],
   coordinates[16],
   coordinates[17],
   coordinates[18],
   coordinates[19],
   [35.9,78.2],
   [23.9,78.2],
   [20.3,72.3],
   [20.3,63.8],
   [25.1,60.4],
   coordinates[20]
 ];
 const screen=document.getElementById('map'),root=document.createElement('div');root.className='journey-map';screen.append(root);
 const fairy=document.createElement('div');fairy.className='journey-fairy';fairy.setAttribute('aria-hidden','true');root.append(fairy);
 window.TruePixelEngine?.ActorAnimator?.adaptMapFairyIcon?.();
 const dialog=document.createElement('dialog');dialog.className='journey-dialog';dialog.setAttribute('aria-labelledby','journey-title');document.body.append(dialog);
 let state,selected=null,at=0,travel=null,position=coordinates[0],last=0;
 const setPosition=(p)=>{position=p;fairy.style.left=p[0]+'%';fairy.style.top=p[1]+'%';};setPosition(position);
 function panel(level){const w=level.world,record=state.records?.[level.id];dialog.dataset.world=w;dialog.style.setProperty('--panel-x',(w%2)*100+'%');dialog.style.setProperty('--panel-y',Math.floor(w/2)*100+'%');dialog.replaceChildren();
  const title=document.createElement('h2');title.id='journey-title';title.textContent=level.name;const stars=document.createElement('div');stars.className='journey-stars';stars.setAttribute('aria-label',`${record?.stars||0} de 3 estrelas`);stars.textContent=Array.from({length:3},(_,i)=>i<(record?.stars||0)?'★':'☆').join(' ');
  const info=document.createElement('p');info.textContent=record?`Melhor desempenho: ${record.points} pontos`:'Fase inédita · conquiste suas estrelas';
  const start=document.createElement('button');start.className='journey-begin';start.textContent='Começar';start.onclick=()=>{dialog.close();state.start(level.id);};const back=document.createElement('button');back.className='journey-back';back.textContent='Voltar';back.onclick=()=>dialog.close();dialog.append(title,stars,info,start,back);dialog.showModal();start.focus();
 }
 function select(level){if(travel){if(selected===level.id){travel=null;setPosition(level.id===21?finalPedestal:coordinates[level.id-1]);panel(level);}return;}if(selected===level.id){panel(level);return;}selected=level.id;
  const target=level.id===21?route.length-1:route.findIndex(p=>p===coordinates[level.id-1]);const points=[position];const direction=target>=at?1:-1;for(let i=at+direction;direction>0?i<=target:i>=target;i+=direction)points.push(route[i]);at=target;
  if(state.reduced||points.length<2){setPosition(points.at(-1));state.notify('A Fada chegou. Selecione a fase novamente para abrir.');return;}
  travel={points,index:0,progress:0};state.notify('A Fada está seguindo o caminho.');
 }
 function frame(now){const dt=Math.min(.04,(now-(last||now))/1000);last=now;if(!screen.hidden&&!document.hidden){if(travel){const a=travel.points[travel.index],b=travel.points[travel.index+1],length=Math.hypot(b[0]-a[0],b[1]-a[1]);travel.progress+=dt*22/Math.max(.1,length);const f=Math.min(1,travel.progress);setPosition([a[0]+(b[0]-a[0])*f,a[1]+(b[1]-a[1])*f]);if(f===1){travel.index++;travel.progress=0;if(travel.index===travel.points.length-1){travel=null;state.notify('A Fada chegou. Clique novamente na fase para abrir.');}}}fairy.style.backgroundPosition=`${Math.floor(now/170)%4/3*100}% ${travel?100:0}%`;}requestAnimationFrame(frame);}requestAnimationFrame(frame);
 window.CrystalJourney={render(options){state=options;travel=null;selected=null;root.querySelectorAll('button').forEach(b=>b.remove());const activeId=Math.min(21,Math.max(1,options.current||options.unlocked||1));const startPoint=activeId===21?finalPedestal:coordinates[activeId-1];at=Math.max(0,route.findIndex(p=>p===startPoint));setPosition(startPoint);
  for(const level of (window.CrystalCampaign?.levels||[])){const point=level.id===21?finalPedestal:coordinates[level.id-1];const button=document.createElement('button');button.className='journey-node';if(!button.dataset)button.dataset={};button.dataset.level=level.id;button.style.left=point[0]+'%';button.style.top=point[1]+'%';const locked=false;button.classList.toggle('locked',locked);button.classList.toggle('done',options.completed.includes(level.id));button.classList.toggle('current',level.id===activeId);button.setAttribute('aria-label',`${level.id===21?'Fase final':`Fase ${level.id}`}: ${level.name}. ${options.completed.includes(level.id)?'Concluída':'Disponível'}`);button.setAttribute('aria-disabled','false');button.onclick=()=>select(level);root.append(button);}
 },get moving(){return !!travel;},close(){travel=null;if(dialog.open)dialog.close();}};
})();

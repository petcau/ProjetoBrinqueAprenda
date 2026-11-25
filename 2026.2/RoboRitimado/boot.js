(() => {
  'use strict';
  const cinemaFiles=[
    'pixel-padrao-v1.png','pixel-doces-danca-v6.png','pixel-doces-historia-v6.png',
    'guitarra-doces-v6.png','guitarra-padrao-v13.png','pixel-camarim-v16.png',
    'orbithop-concert-v13.png','orbithop-backstage-v13.png','orbithop-dressing-v13.png',
    'orbithop-encore-v14.png','orbithop-ruinas-v14.png','galactus-v14.png',
    'memoria-devorador-v13.png','orbithop-v11.png','palco-orbithop-v09.png',
    'pixel-boas-vindas-v11.png','void-v16.png'
  ];
  let pending=null,complete=false;
  function urls(){
    return [...new Set([
      ...cinemaFiles.map(name=>'assets/'+name),
      ...RR_LEVELS.flatMap(level=>[level.sprite,level.background,level.symbol,level.album,level.steps?.sprite||level.dance?.sprite]).filter(Boolean)
    ])];
  }
  function prepare(){
    if(pending)return pending;
    if(complete)return Promise.resolve();
    const dialog=document.getElementById('tuneDialog');
    const bar=document.getElementById('tuneProgress');
    const label=document.getElementById('tuneStatus');
    const retry=document.getElementById('tuneRetry');
    retry.hidden=true;
    const list=urls();
    let completed=0,cursor=0;
    const failures=[];
    bar.max=list.length;bar.value=0;
    label.textContent='Pixel está afinando os mundos…';
    if(!dialog.open)dialog.showModal();
    pending=(async()=>{
      async function worker(){
        while(cursor<list.length){
          const url=list[cursor++];
          try{const image=await RR_SPRITES.load(url).ready;if(image.decode)await Promise.race([image.decode().catch(()=>{}),new Promise(resolve=>setTimeout(resolve,3000))]);completed++;bar.value=completed;}
          catch(error){failures.push(error);}
          label.textContent=Math.round(completed/list.length*100)+'% · Conectando os mundos';
        }
      }
      await Promise.all(Array.from({length:6},worker));
      if(failures.length){
        label.textContent='Uma conexão precisa de mais um acorde. Toque para tentar novamente.';
        retry.hidden=false;retry.focus();
        throw failures[0];
      }
      complete=true;dialog.close();
    })().finally(()=>{pending=null;});
    return pending;
  }
  window.RR_BOOT=Object.freeze({prepare});
})();

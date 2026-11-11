(() => {
  'use strict';
  const elements = {
    fire: ['🔥', '#ff7a18', '#f44336', '#ffd54f'],
    water: ['💧', '#2196f3', '#4dd0e1', '#c5fbff'],
    earth: ['◆', '#8d6e63', '#d4a373', '#7cb342'],
    air: ['🌀', '#e3f2fd', '#b3e5fc', '#ffe082'],
    ice: ['❄', '#b9f2ff', '#c4b5fd', '#ffffff'],
    pixel: ['✦', '#00e5ff', '#ff4fd8', '#e3f2fd'],
    void: ['☾', '#7c3aed', '#311b5b', '#f472b6']
  };
  const rules = Object.freeze({ pixelHP: 100, bossHP: 150, finaleHP: 18, warning: 4,
    interval: 8, tolerance: .24, assistedTolerance: .32, recoveryLimit: 2 });
  const hit = (damage = 0, loss = 0, heal = 0) => ({ damage, loss, heal });
  const enemyAttacks = {
    stomp:'rupture', fist:'eclipse', meteors:'meteors', chains:'chains',
    ash:'ash', magnet:'magnet', bite:'rift', constellation:'constellation',
    wind:'rupture', geode:'eclipse', bridge:'meteors', bubble:'eclipse',
    rebound:'eclipse', beam:'beam', return:'rupture', steal:'magnet',
    climb:'rupture', rift:'rift', echo:'beam', protect:'meteors',
    steam:'ash', prism:'beam'
  };
  function move(id, name, actor, element, pattern, cue, resolve, details = {}) {
    return Object.freeze({ id, name, actor, element, pattern, cue, resolve,
      enemyAttack:enemyAttacks[id]||null, duration:Math.max(4,pattern.length+1), ...details });
  }
  const moves = [
    move('phoenix','Riff de Fênix','Pixel','fire',[0,2,1,3],'Quatro notas fazem nascer a fênix.',(n,k)=>hit(n===k?10:n>=k-1?6:0)),
    move('tide','Maré Harmônica','Pixel','water',[1],'Segure a seta até o fim da cauda.',(n,k,partial)=>hit(n?8:partial?4:0),{hold:2}),
    move('tectonic','Acorde Tectônico','Pixel','earth',[1,0,3],'Cada acerto ergue um cristal.',n=>hit(n*3)),
    move('wind','Solo dos Ventos','Pixel','air',[2,3,0],'Invoque o vento para saltar sobre a onda.',(n,k)=>n>=k-1?hit(6):hit(0,5)),
    move('bridge','Ponte de Cristal','Pixel','ice',[0,1,2],'Congele a mão que prepara o projétil.',(n,k)=>n===k?hit(5):hit(0,n?0:5)),
    move('geode','Escudo de Geodo','Pixel','earth',[1,2],'Duas notas erguem um escudo de pedra.',(n,k)=>hit(0,n===k?0:n?4:8)),
    move('bubble','Bolha de Ressonância','Pixel','water',[1,3],'Segure a defesa. Use a última seta para devolver.',(n,k,p,notes)=>notes[0]?.result==='miss'?hit(0,5):hit(n===k?8:0),{hold:2}),
    move('tune','Afinação Vital','Pixel','pixel',[2,1,2],'Toque um acorde de reparo.',(n,k)=>hit(0,0,n===k?8:n>=k-1?5:0)),
    move('fist','Punho do Eclipse','Galactus','void',[2],'Acerte a nota de defesa antes do impacto.',n=>n?hit():hit(0,8)),
    move('meteors','Rugido de Meteoros','Galactus','void',[0,2,3],'Cada seta rebate um meteoro.',(n,k)=>n===k?hit(8):hit(0,3*(k-n))),
    move('stomp','Pisada de Ruptura','Galactus','void',[1,2,1,2],'Defenda-se com ↓ e ↑. Acerte a sequência para devolver a onda.',(n,k)=>n>=k-1?hit(6):hit(0,n?4:7),{blocked:[0,3],duration:8,spacing:2}),
    move('chains','Correntes do Silêncio','Galactus','void',[3,0,1],'Repita o padrão para soltar a guitarra.',(n,k)=>n===k?hit():hit(0,6)),
    move('ash','Sopro de Cinzas','Galactus','air',[2,0,3],'Três notas dispersam as cinzas.',(n,k)=>n===k?hit(6):hit(0,5)),
    move('magnet','Ímã Cósmico','Galactus','void',[0,1,0,3],'Acerte três passos para escapar da sucata.',(n,k)=>n>=k-1?hit():hit(0,7)),
    move('bite','Mordida do Vazio','Galactus','void',[3],'Abra uma saída atrás de Galactus.',n=>hit(n?8:0)),
    move('constellation','Constelação Aprisionadora','Galactus','void',[2,1,3,0],'Cada nota apaga uma estrela. Apague três.',(n,k)=>n>=k-1?hit():hit(0,6)),
    move('rebound','Rebote Interdimensional','Duelo','pixel',[0,2,3],'Devolva a esfera três vezes.',(n,k)=>n===k?hit(12):hit(0,6)),
    move('beam','Duelo de Ondas','Duelo','pixel',[0,2,1,3,2,3],'Quatro acertos vencem a disputa.',(n,k)=>n>=Math.ceil(k*2/3)?hit(10):hit(0,n<2?6:0)),
    move('return','O Golpe que Volta','Duelo','pixel',[1,2],'Abra o portal sob o punho.',(n,k)=>n===k?hit(10):hit(0,n?0:6)),
    move('steal','Roubo de Acorde','Duelo','pixel',[3,1,0],'Repita a nota roubada e recupere energia.',(n,k)=>hit(0,0,n===k?5:0)),
    move('climb','Escalada no Braço','Duelo','earth',[2,3,2,0],'Cada acerto faz Pixel subir mais alto.',(n,k)=>hit(n===k?12:n?5:0)),
    move('rift','Disputa pelo Portal de OrbitHop','Duelo','pixel',[0,3,2,1,3,2],'Acerte quatro notas para fechar a fenda.',(n,k)=>n>=Math.ceil(k*2/3)?hit(8):hit(0,6)),
    move('echo','Provocação e Resposta Musical','Duelo','ice',[1,2,0],'Copie os três pulsos da armadura.',(n,k)=>hit(n===k?7:0)),
    move('protect','Proteção de OrbitHop','Duelo','earth',[0,3,2],'Erga um escudo sobre a cidade.',(n,k)=>n>=k-1?hit(8):hit(0,5)),
    move('steam','Vapor em Contratempo','Pixel','water',[1,0,2,3],'Água + fogo. Complete os dois pares.',(n,k,p,notes)=>combo(notes,8),{second:'fire'}),
    move('storm','Tempestade Harmônica','Pixel','water',[1,2,0,3],'Água + ar. Complete os dois pares.',(n,k,p,notes)=>combo(notes,10),{second:'air'}),
    move('refrain','Meteorito de Refrão','Pixel','earth',[1,0,3,2],'Terra + fogo. Complete os dois pares.',(n,k,p,notes)=>combo(notes,12),{second:'fire'}),
    move('prism','Prisma Celestial','Pixel','ice',[2,0,1,3],'Gelo + ar. Complete os dois pares.',(n,k,p,notes)=>combo(notes,8),{second:'air'}),
    move('garden','Jardim de Frequências','Pixel','earth',[0,1,2,3],'Terra + água. Complete os dois pares.',(n,k,p,notes)=>combo(notes,0,6),{second:'water'}),
    move('aurora','Aurora de OrbitHop','Pixel','pixel',[0,1,2,3,0,2],'Una terra, água, fogo e ar aos portais.',(n,k)=>hit(n===k?12:n>=3?6:0),{second:'air'})
  ];
  function landed(note) { return note.result === 'perfect' || note.result === 'good' || note.result === 'near' && !note.hold; }
  function combo(notes, damage, heal = 0) {
    const first = notes.slice(0,2).every(landed);
    return first && notes.slice(2).every(landed) ? hit(damage,0,heal) : hit(first?4:0);
  }
  const byId = Object.fromEntries(moves.map(event=>[event.id,event]));
  const deck = ['stomp','phoenix','meteors','tide','geode','wind','rebound','tectonic',
    'constellation','bridge','beam','bubble','protect','tune','storm','refrain','aurora'];
  const alternate = ['fist','chains','ash','magnet','bite','return','steal','climb','rift','echo','steam','prism','garden'];
  function plan(short, variation = 0) {
    const order = [...deck];
    if (variation) for (let i=0;i<8;i++) order[7+i]=alternate[(variation+i-1)%alternate.length];
    let cursor = 8;
    const events = order.map(id=>{
      const event = byId[id];
      const begin = cursor + rules.warning;
      cursor = begin + event.duration + rules.interval;
      const shorter=short && event.pattern.length>3 && !event.second;
      return { ...event, key: begin, warn: begin-rules.warning, begin, end: begin+event.duration,
        pattern: shorter ? event.pattern.slice(0,-1) : event.pattern,
        cue: shorter ? 'Sequência curta. Siga as setas do aviso.' : event.cue };
    });
    return { events, end: cursor };
  }
  function finale(begin, ring) {
    const element = ['earth','water','fire','air'][ring];
    return { ...move('finale','Sinfonia dos Mundos','Pixel',element,[[1,0,3],[1,3,2],[0,2,3],[2,1,0]][ring],
      'Dois acertos formam o próximo anel.',n=>hit(n>=2?1:0)), key:begin, warn:begin-rules.warning, begin, end:begin+4, ring };
  }
  function eventNotes(event, beatLength) {
    return event.pattern.map((lane,index)=>{
      const beat = event.begin + index * (event.spacing || 1) + (event.hold && index ? event.hold : 0);
      return { beat, lane, time:beat*beatLength, event:event.key, hold:index===0&&event.hold?event.hold*beatLength:0 };
    });
  }
  function create(schedule) {
    let pixel = rules.pixelHP, enemy = rules.bossHP, energy=0, repairs=0, ring=0, normal=0, result=null;
    const resolved = new Set();
    function resolve(event, notes, beat) {
      if (resolved.has(event.key)) return;
      resolved.add(event.key);
      const count=notes.filter(landed).length;
      const outcome=event.resolve(count,notes.length,notes.some(note=>note.result==='near'),notes);
      if (event.id==='finale') {
        if (outcome.damage) ring++;
        if (ring===4) enemy=0;
      } else {
        enemy=Math.max(1,enemy-outcome.damage);
        pixel=Math.max(0,pixel-outcome.loss);
        if (outcome.heal && (event.id!=='tune' || repairs<rules.recoveryLimit&&energy>=6)) {
          pixel=Math.min(rules.pixelHP,pixel+outcome.heal);
          if(event.id==='tune'){repairs++;energy-=6;}
        } else outcome.heal=0;
      }
      result={event,beat,count,total:notes.length,...outcome};
    }
    return {
      schedule,
      note(note) {
        if (!landed(note)) return;
        energy=Math.min(12,energy+1);
        if (note.event!=null) return;
        normal+=note.result==='near'?.5:1;
        if(normal>=5){normal-=5;enemy=Math.max(1,enemy-3);}
      },
      resolve,
      resolved: key=>resolved.has(key),
      snapshot:()=>({pixel,enemy,energy,repairs,ring,result,won:enemy===0,lost:pixel===0,ready:enemy<=rules.finaleHP})
    };
  }
  window.RR_BATTLE=Object.freeze({elements,rules,moves,plan,finale,eventNotes,create});
})();

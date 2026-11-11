/* Quantities are rational values in data, represented by pips and water gauges in play. */
(() => {
 const worlds = [
  {name:'Caverna de Cristal',subtitle:'O despertar da terra',healed:'Cristais, musgos e pinturas da caverna voltaram a brilhar.',x:5,y:0},
  {name:'Floresta Silenciada',subtitle:'As sementes do amanhã',healed:'Sementes despertaram. A floresta ganha vida outra vez.',x:60,y:0},
  {name:'Rio Escuro',subtitle:'Água que volta a cantar',healed:'A água ficou mais clara. Os peixes encontram seu caminho.',x:60,y:88},
  {name:'Pico da Névoa',subtitle:'O céu além da tempestade',healed:'A névoa se abriu. Estrelas iluminam o céu de fantasia.',x:0,y:88}
 ];
 const gems = [
  {id:'quartz',name:'Quartzo',color:'#d8e8ff',symbol:'◇'},
  {id:'opal',name:'Opala de fogo',color:'#ffa23c',symbol:'▼'},
  {id:'aqua',name:'Água-marinha',color:'#63e5ff',symbol:'●'},
  {id:'tourmaline',name:'Turmalina Paraíba',color:'#57ffe3',symbol:'◎'},
  {id:'emerald',name:'Esmeralda',color:'#7aee8d',symbol:'⬡'},
  {id:'citrine',name:'Citrino',color:'#ffd85e',symbol:'▲'},
  {id:'topaz',name:'Topázio imperial',color:'#ffb454',symbol:'▥'},
  {id:'rubellite',name:'Rubelita',color:'#ff72bd',symbol:'◈'},
  {id:'diamond',name:'Diamante',color:'#cceeff',symbol:'✦'}
 ];
 const g=(kind,value,x,y,dark=false)=>({kind,value,x,y,dark});
 const levels = [
  {name:'O primeiro eco',kind:'fusion',hint:'Una os dois quartzos. Depois encontre a sombra do cristal que nasceu.',pieces:[g('quartz',2,.3,.46),g('quartz',3,.67,.46)],target:5,tools:['drag','launch'],goals:['Juntar os quartzos','Anular a sombra','Despertar o diamante']},
  {name:'A chama que liberta',kind:'burn',hint:'A opala consome brilhos. Use as duas chamas para desfazer a barreira.',pieces:[g('quartz',7,.62,.45),g('opal',2,.28,.28),g('opal',5,.28,.75)],tools:['drag','launch'],goals:['Queimar a barreira','Apagar o restante','Despertar o diamante']},
  {name:'Caminhos de pedra',kind:'pinball',hint:'Lance pelos corredores. Una os quartzos, evite a chama e anule a sombra.',pieces:[g('quartz',2,.25,.25),g('quartz',2,.7,.7)],target:4,hazard:true,walls:true,tools:['drag','launch'],goals:['Quicar na parede','Juntar os quartzos','Anular a sombra','Despertar o diamante']},
  {name:'O salto da luz',kind:'pinball',hint:'Faça uma tabela na parede e leve a luz ao outro quartzo. Cuidado com a opala!',pieces:[g('quartz',3,.26,.72),g('quartz',4,.72,.26)],target:7,hazard:true,walls:true,tools:['drag','launch'],goals:['Quicar na parede','Juntar os quartzos','Anular a sombra','Despertar o diamante']},
  {name:'Os três espelhos',kind:'mirror',hint:'Gire cada topázio até iluminar seu alvo. Os três feixes precisam ficar acesos juntos.',angles:[1,2,1],tools:['rotate'],goals:['Iluminar o primeiro alvo','Iluminar o segundo alvo','Iluminar o terceiro alvo','Anular a sombra','Despertar o diamante']},
  {name:'Sementes em dobro',kind:'portal',hint:'Passe o quartzo pela esmeralda. Ele cresce, acelera e pode anular sua sombra.',pieces:[g('quartz',3,.26,.47),g('quartz',6,.79,.47,true)],portals:[{x:.52,y:.47}],tools:['drag','launch'],goals:['Atravessar a esmeralda','Anular a sombra','Despertar o diamante']},
  {name:'O segredo do citrino',kind:'split',hint:'Toque duas vezes no citrino, segure e chacoalhe. Anule cada fragmento com sua sombra.',pieces:[g('citrine',12,.3,.48)],split:3,targets:[4,4,4],tools:['drag','launch','shake'],goals:['Dividir o citrino','Anular três fragmentos','Despertar o diamante']},
  {name:'Sementes contra o tempo',kind:'race',hint:'Divida os citrinos, passe os fragmentos pela esmeralda e anule as sombras antes do tempo.',pieces:[g('citrine',4,.25,.27),g('citrine',4,.25,.75)],split:2,targets:[4,4,4,4],portals:[{x:.51,y:.5}],time:120,tools:['drag','launch','shake'],goals:['Dividir os citrinos','Multiplicar fragmentos','Anular todas as sombras','Despertar o diamante']},
  {name:'A floresta desperta',kind:'race',hint:'Chacoalhe, atravesse o portal e encontre as sombras iguais. Cada acerto faz a mata crescer.',pieces:[g('citrine',6,.25,.27),g('citrine',6,.25,.75)],split:3,targets:[4,4,4,4,4,4],portals:[{x:.51,y:.5}],time:150,tools:['drag','launch','shake'],goals:['Dividir os citrinos','Multiplicar fragmentos','Anular todas as sombras','Despertar o diamante']},
  {name:'O equilíbrio da Árvore Mãe',kind:'balance',hint:'Dobre o quartzo na esmeralda e coloque uma pedra em cada prato. Depois liberte as sombras.',pieces:[g('quartz',3,.29,.28),g('quartz',6,.75,.28)],portals:[{x:.5,y:.3}],tools:['drag','launch'],goals:['Multiplicar o bloco','Equilibrar os dois pratos','Anular as sombras','Despertar o diamante']},
  {name:'Um corte de água',kind:'slice',hint:'Escolha Cortar e deslize pela água-marinha. Leve cada metade à sua sombra.',pieces:[g('aqua',1,.31,.48)],targets:[.5,.5],tools:['drag','launch','cut'],goals:['Cortar ao meio','Anular as duas metades','Despertar o diamante']},
  {name:'Gota por gota',kind:'fraction',hint:'Corte até formar quartos. Una três pedaços para uma sombra; o restante encontra a outra.',pieces:[g('aqua',1,.29,.45)],targets:[.75,.25],tools:['drag','launch','cut'],goals:['Cortar em quartos','Unir três partes','Anular as sombras','Despertar o diamante']},
  {name:'A força da correnteza',kind:'current',hint:'Corte as bolhas em movimento e anule as sombras nos pontos poluídos. A correnteza não para.',pieces:[g('aqua',1,.3,.25)],targets:[.5,.25,.25],current:.000025,gravity:.018,tools:['drag','launch','cut'],goals:['Cortar na correnteza','Limpar os três pontos','Despertar o diamante']},
  {name:'Águas livres',kind:'current',hint:'Divida a água em quartos e leve a opala até o resíduo escuro.',pieces:[g('aqua',1,.3,.25),g('opal',2,.28,.75),g('quartz',2,.8,.75,true)],targets:[.25,.25,.25,.25],current:.00004,gravity:.025,tools:['drag','launch','cut'],goals:['Cortar as bolhas','Queimar o resíduo','Purificar a água','Despertar o diamante']},
  {name:'A roda das águas',kind:'gear',hint:'Corte e reúna a água na medida das sombras. Limpe os dentes para fazer a roda girar.',pieces:[g('aqua',1,.28,.3),g('aqua',1,.28,.72)],targets:[.75,.75,.5],tools:['drag','launch','cut'],goals:['Dividir a água','Reunir as partes','Limpar a engrenagem','Despertar o diamante']},
  {name:'O pulso do vento',kind:'rhythm',hint:'Observe os brilhos do pêndulo: eles crescem de dois em dois. Lance a rubelita quando o anel acender.',pieces:[g('rubellite',8,.26,.65)],target:8,wind:.000025,tools:['drag','launch'],goals:['Seguir a sequência','Lançar no pulso','Anular a sombra','Despertar o diamante']},
  {name:'O anel misterioso',kind:'unknown',hint:'Teste quartzos no anel. Poucas faíscas: falta brilho. Muitas: sobra. Descubra a medida escondida.',pieces:[g('quartz',2,.25,.24),g('quartz',4,.25,.5),g('quartz',6,.25,.76)],secret:4,tools:['drag','launch'],goals:['Testar o anel','Encontrar a medida','Anular a sombra','Despertar o diamante']},
  {name:'Labirinto dos ecos',kind:'maze',hint:'Corte a água, atravesse a esmeralda e anule as sombras. Gire o topázio para guiar o feixe.',pieces:[g('aqua',1,.25,.3)],targets:[1,1],portals:[{x:.51,y:.5}],angles:[1],walls:true,tools:['drag','launch','cut','rotate'],goals:['Cortar','Multiplicar','Guiar o feixe','Anular as sombras','Despertar o diamante']},
  {name:'Além da tempestade',kind:'maze',hint:'Corte em quartos e use a esmeralda. Acerte os espelhos e liberte todas as sombras.',pieces:[g('aqua',1,.25,.3)],targets:[.5,.5,.5,.5],portals:[{x:.51,y:.5}],angles:[2,1],wind:.00002,walls:true,tools:['drag','launch','cut','rotate'],goals:['Cortar','Multiplicar','Guiar os feixes','Anular as sombras','Despertar o diamante']},
  {name:'A última sinfonia',kind:'final',hint:'Siga o pulso: corte, multiplique e lance até anular as sombras. O diamante vai abrir o céu.',pieces:[g('aqua',1,.25,.45)],targets:[1,1],portals:[{x:.51,y:.5}],wind:.00002,rhythm:true,time:120,tools:['drag','launch','cut'],goals:['Cortar no pulso','Multiplicar','Lançar no pulso','Anular as sombras','Despertar o diamante']}
 ].map((level,i)=>({...level,id:i+1,world:Math.floor(i/5),boss:(i+1)%5===0}));
 window.CrystalCampaign={worlds,gems,levels};
})();

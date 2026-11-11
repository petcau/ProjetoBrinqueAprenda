'use strict';
// Campaign goals. OrbitHop uses the battle's life bars and finale.
window.RR_CAMPAIGN=Object.freeze([
 {id:'doces',name:'Reino dos Doces',goal:3000,released:true},
 {id:'brinquedos',name:'Brinquedolândia',goal:3500,released:true},
 {id:'gelo',name:'Castelo Invernal',goal:4000,released:true},
 {id:'ceu',name:'Paraíso',goal:4500,released:true},
 {id:'deserto',name:'Deserto Escaldante',goal:5000,released:true},
 {id:'pantano',name:'Pântano Mágico',goal:5500,released:true},
 {id:'nebulosa',name:'Floresta Nebulosa',goal:6000,released:true},
 {id:'atlanta',name:'Atlanta',goal:6500,released:true},
 {id:'masmorra',name:'Masmorra Ardente',goal:7000,released:true},
 {id:'colina',name:'Colina Escarlate',goal:7500,released:true},
 {id:'fase11',name:'OrbitHop · Endgame',goal:null,released:true}
].map((stage,index)=>Object.freeze({...stage,number:index+1})));

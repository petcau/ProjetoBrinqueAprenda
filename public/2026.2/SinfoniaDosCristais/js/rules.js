/* Exact crystalline quantities and equation rules, independent of rendering. */
(() => {
 'use strict';
 const gcd=(a,b)=>b?gcd(b,a%b):Math.abs(a);
 class Quantity {
  constructor(n,d=1){if(!Number.isSafeInteger(n)||!Number.isSafeInteger(d)||!d)throw Error('Quantidade inválida');if(d<0){n=-n;d=-d;}const g=gcd(n,d);this.n=n/g;this.d=d/g;Object.freeze(this);}
  static from(v){if(v instanceof Quantity)return v;if(typeof v==='object'&&v)return new Quantity(v.n,v.d);if(!Number.isFinite(v))throw Error('Quantidade inválida');return new Quantity(Math.round(v*1000000),1000000);}
  add(v){v=Quantity.from(v);return new Quantity(this.n*v.d+v.n*this.d,this.d*v.d);}
  subtract(v){v=Quantity.from(v);return this.add(new Quantity(-v.n,v.d));}
  multiply(v){v=Quantity.from(v);return new Quantity(this.n*v.n,this.d*v.d);}
  divide(v){v=Quantity.from(v);if(!v.n)throw Error('Divisão por zero');return new Quantity(this.n*v.d,this.d*v.n);}
  equals(v){v=Quantity.from(v);return this.n===v.n&&this.d===v.d;}
  get value(){return this.n/this.d;}
 }
 function evaluate(terms){
  if(!terms.length)return new Quantity(0);
  const stack=[];
  for(const term of terms){let q=term.terms?evaluate(term.terms):Quantity.from(term.value);const op=term.op||(term.kind==='opal'?'subtract':'add');
   if(!stack.length){stack.push(op==='subtract'?q.multiply(-1):q);continue;}
   if(op==='multiply'||op==='divide'){stack[stack.length-1]=stack.at(-1)[op](q);}else {stack.push(op==='subtract'?q.multiply(-1):q);}
  }
  return stack.reduce((sum,q)=>sum.add(q),new Quantity(0));
 }
 function signature(terms){return terms.map(p=>p.terms?`(${signature(p.terms)})`:`${p.kind}:${Quantity.from(p.value).n}/${Quantity.from(p.value).d}:${p.op||(p.kind==='opal'?'subtract':'add')}`).join('|');}
 class Board {
  constructor(){this.pieces=new Map();this.groups=new Map();this.next=1;this.selected=null;this.diamonds=0;this.diamondsIntroduced=false;}
  add(spec){const id=spec.id||'p'+this.next++;if(this.pieces.has(id))throw Error('Cristal duplicado');const p={...spec,id,value:Quantity.from(spec.value),dark:!!spec.dark,boosted:!!spec.boosted,group:null};this.pieces.set(id,p);return p;}
  get(id){const p=this.pieces.get(id);if(!p)throw Error('Cristal inexistente');return p;}
  members(id){const p=this.get(id);return p.group?this.groups.get(p.group).map(k=>this.get(k)):[p];}
  orderSpatially(){for(const ids of this.groups.values())ids.sort((a,b)=>{const x=this.get(a).x,y=this.get(b).x;return Number.isFinite(x)&&Number.isFinite(y)?x-y:0;});}
  tap(id){this.get(id);if(this.selected===id){this.selected=null;return{type:'deselect'};}if(!this.selected){this.selected=id;return{type:'select',id};}const first=this.selected;this.selected=null;return this.connect(first,id);}
  emptyTap(){const id=this.selected;return id?{type:'invalid',id,reason:'empty'}:{type:'none'};}
  connect(aId,bId){const a=this.get(aId),b=this.get(bId);if(a.id===b.id)return{type:'none'};
   if(a.group&&a.group===b.group)return{type:'none'};
   const left=this.members(aId),right=this.members(bId);
   if(a.dark!==b.dark){if(this.matches(aId,bId))return this.annul(aId,bId);return{type:'invalid',reason:'mismatch',ids:[aId,bId]};}
   if(a.dark)return{type:'invalid',reason:'shadow',ids:[aId,bId]};
   for(const p of [...left,...right])if(p.group)this.groups.delete(p.group);
   const group='e'+this.next++,ids=[...left,...right].map(p=>p.id);this.groups.set(group,ids);for(const p of [...left,...right])p.group=group;
   return{type:'connected',group,ids};
  }
  group(ids){if(ids.length<2)throw Error('Equação precisa de duas peças');const list=ids.map(id=>this.get(id));if(list.some(p=>p.group)||list.some(p=>p.dark!==list[0].dark))throw Error('Grupo inválido');const id='e'+this.next++;this.groups.set(id,[...ids]);list.forEach(p=>p.group=id);return id;}
  matches(aId,bId){const a=this.get(aId),b=this.get(bId);if(a.dark===b.dark||!!a.group!==!!b.group)return false;const left=this.members(aId),right=this.members(bId);return signature(left)===signature(right)&&evaluate(left).equals(evaluate(right));}
  annul(aId,bId){if(!this.matches(aId,bId))return{type:'invalid',reason:'mismatch'};const pairs=this.members(aId).map((p,i)=>[p,this.members(bId)[i]]);const ids=pairs.flat().map(p=>p.id);for(const p of pairs.flat()){if(p.group)this.groups.delete(p.group);this.pieces.delete(p.id);}this.selected=null;return{type:'annulled',pairs,ids};}
  replace(ids,specs){const old=ids.map(id=>this.get(id)),group=old[0].group;if(old.some(p=>p.group!==group))throw Error('Operação cruza paredes de equações');const order=group?[...this.groups.get(group)]:null,index=order?order.indexOf(ids[0]):0;const created=specs.map(s=>this.add(s));ids.forEach(id=>this.pieces.delete(id));if(order){const remaining=order.filter(id=>!ids.includes(id));remaining.splice(Math.min(index,remaining.length),0,...created.map(p=>p.id));this.groups.delete(group);if(remaining.length>1){this.groups.set(group,remaining);remaining.forEach(id=>this.get(id).group=group);}else if(remaining.length)this.get(remaining[0]).group=null;}this.selected=null;return created;}
  dragOnto(aId,bId){const a=this.get(aId),b=this.get(bId);if(a.dark!==b.dark)return this.annul(aId,bId);if(a.dark||a.group!==b.group)return{type:'collision'};
   const common={x:b.x,y:b.y,boosted:a.boosted||b.boosted};
   if(a.kind==='quartz'&&b.kind==='quartz')return{type:'fusion',removed:[aId,bId],pieces:this.replace([aId,bId],[{...common,kind:'quartz',value:a.value.add(b.value)}])};
   if(new Set([a.kind,b.kind]).size===2&&[a.kind,b.kind].every(k=>['quartz','opal'].includes(k))){const q=a.kind==='quartz'?a:b,o=a.kind==='opal'?a:b,difference=q.value.subtract(o.value);return{type:'subtraction',removed:[aId,bId],pieces:this.replace([aId,bId],difference.n?[{...common,kind:difference.n>0?'quartz':'opal',value:new Quantity(Math.abs(difference.n),difference.d)}]:[])};}
   if(a.kind==='aqua'&&b.kind==='aqua')return{type:'fusion',removed:[aId,bId],pieces:this.replace([aId,bId],[{...common,kind:'aqua',value:a.value.add(b.value)}])};
   return{type:'collision'};
  }
  split(id,count=2){const p=this.get(id);if(p.dark||!['aqua','citrine'].includes(p.kind)||!Number.isInteger(count)||count<2||count>6)return{type:'invalid',reason:'split'};if(p.kind==='aqua'&&(count!==2||p.value.value<=.25))return{type:'invalid',reason:'quarter-limit'};const value=p.value.divide(count),spec={kind:p.kind,value,x:p.x,y:p.y,boosted:p.boosted};return{type:'split',removed:[id],pieces:this.replace([id],Array.from({length:count},()=>({...spec})))};}
  boost(id){const p=this.get(id);if(p.dark||p.boosted)return false;p.value=p.value.multiply(2);p.boosted=true;return true;}
  introduceDiamonds(){if(!this.diamondsIntroduced){this.diamondsIntroduced=true;this.diamonds+=10;return true;}return false;}
  reward(){this.diamonds++;}
  fractionDivide(topIds,bottomIds){if(!Array.isArray(topIds)||!Array.isArray(bottomIds)||topIds.length===0||bottomIds.length===0)return{type:'invalid',reason:'empty'};const top=topIds.map(id=>this.pieces.get(id)),bottom=bottomIds.map(id=>this.pieces.get(id));if(top.some(p=>!p||p.dark)||bottom.some(p=>!p||p.dark))return{type:'invalid',reason:'invalid_piece'};const sumTop=top.reduce((acc,p)=>acc.add(p.value),new Quantity(0)),sumBottom=bottom.reduce((acc,p)=>acc.add(p.value),new Quantity(0));if(!sumTop.equals(sumBottom)||sumTop.n<=0)return{type:'invalid',reason:'mismatch'};const allIds=[...topIds,...bottomIds],kind=top[0]?.kind||'aqua',res=this.replace(allIds,[{kind,value:new Quantity(1),x:.5,y:.5}]);return{type:'divided',piece:res[0],pieces:res};}
  dissolve(id){const p=this.get(id);if(!p.group||p.dark||this.diamonds<1)return{type:'invalid',reason:'diamond'};const ids=[...this.groups.get(p.group)];this.groups.delete(p.group);ids.forEach(id=>this.get(id).group=null);this.diamonds--;return{type:'dissolved',ids};}
  get solved(){return this.pieces.size===0;}
 }
 const api={Quantity,evaluate,signature,Board};if(typeof window!=='undefined')window.CrystalRules=api;else globalThis.CrystalRules=api;
})();

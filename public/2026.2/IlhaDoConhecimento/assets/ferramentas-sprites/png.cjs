// PNG mínimo (8 bits, sem entrelaçamento) para ler/gravar RGBA.
const zlib=require('zlib'),fs=require('fs');
const CRC=(()=>{const t=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xedb88320^(c>>>1):c>>>1;t[n]=c>>>0;}return t;})();
const crc=b=>{let c=0xffffffff;for(const x of b)c=CRC[(c^x)&255]^(c>>>8);return (c^0xffffffff)>>>0;};
function read(file){
  const b=fs.readFileSync(file);let p=8,w,h,depth,type,inter,idat=[],pal=null,trns=null;
  while(p<b.length){const len=b.readUInt32BE(p),t=b.toString('ascii',p+4,p+8),d=b.subarray(p+8,p+8+len);p+=12+len;
    if(t==='IHDR'){w=d.readUInt32BE(0);h=d.readUInt32BE(4);depth=d[8];type=d[9];inter=d[12];}
    else if(t==='PLTE')pal=d;else if(t==='tRNS')trns=d;else if(t==='IDAT')idat.push(d);else if(t==='IEND')break;}
  if(depth!==8||inter)throw new Error(file+': formato não suportado depth='+depth+' inter='+inter);
  const ch={0:1,2:3,3:1,4:2,6:4}[type],bpp=ch,stride=w*ch,raw=zlib.inflateSync(Buffer.concat(idat));
  const px=Buffer.alloc(stride*h);let prev=Buffer.alloc(stride);
  for(let y=0;y<h;y++){const f=raw[y*(stride+1)],line=raw.subarray(y*(stride+1)+1,(y+1)*(stride+1)),out=px.subarray(y*stride,(y+1)*stride);
    for(let x=0;x<stride;x++){const a=x>=bpp?out[x-bpp]:0,up=prev[x],c=x>=bpp?prev[x-bpp]:0;let v=line[x];
      if(f===1)v+=a;else if(f===2)v+=up;else if(f===3)v+=(a+up)>>1;else if(f===4){const pp=a+up-c,pa=Math.abs(pp-a),pb=Math.abs(pp-up),pc=Math.abs(pp-c);v+=pa<=pb&&pa<=pc?a:pb<=pc?up:c;}
      out[x]=v&255;}prev=out;}
  const rgba=Buffer.alloc(w*h*4);
  for(let i=0;i<w*h;i++){let r,g,bl,a=255;
    if(type===6){r=px[i*4];g=px[i*4+1];bl=px[i*4+2];a=px[i*4+3];}
    else if(type===2){r=px[i*3];g=px[i*3+1];bl=px[i*3+2];}
    else if(type===0){r=g=bl=px[i];}
    else if(type===4){r=g=bl=px[i*2];a=px[i*2+1];}
    else {const k=px[i];r=pal[k*3];g=pal[k*3+1];bl=pal[k*3+2];a=trns&&k<trns.length?trns[k]:255;}
    rgba[i*4]=r;rgba[i*4+1]=g;rgba[i*4+2]=bl;rgba[i*4+3]=a;}
  return {w,h,type,data:rgba};
}
function write(file,img){
  const {w,h,data}=img,raw=Buffer.alloc((w*4+1)*h);
  for(let y=0;y<h;y++){raw[y*(w*4+1)]=0;data.copy(raw,y*(w*4+1)+1,y*w*4,(y+1)*w*4);}
  const chunk=(t,d)=>{const l=Buffer.alloc(4);l.writeUInt32BE(d.length);const td=Buffer.concat([Buffer.from(t,'ascii'),d]);const c=Buffer.alloc(4);c.writeUInt32BE(crc(td));return Buffer.concat([l,td,c]);};
  const ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(w,0);ihdr.writeUInt32BE(h,4);ihdr[8]=8;ihdr[9]=6;
  fs.writeFileSync(file,Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',ihdr),chunk('IDAT',zlib.deflateSync(raw,{level:9})),chunk('IEND',Buffer.alloc(0))]));
}
module.exports={read,write,blank:(w,h)=>({w,h,data:Buffer.alloc(w*h*4)})};

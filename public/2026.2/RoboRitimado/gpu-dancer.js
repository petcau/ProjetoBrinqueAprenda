(() => {
  'use strict';
  // One connected texture and one GPU draw replace 192 Canvas clipping passes.
  // A complete-image fallback remains available when WebGL is disabled/lost.
  let device=null,failed=false;
  const smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};
  function project(u,v,w,h,p,x,floor,scale,out){
    const point=(a,b)=>{
      const lower=smooth((b-.55)/.45),left=1-smooth((a-.38)/.24);
      const dx=(p.bend*Math.sin(b*Math.PI)+p.step*Math.sin(b*Math.PI*2)*lower)*h;
      const dy=-(p.leftFoot*left+p.rightFoot*(1-left))*lower*h;
      const px=(a*w-w/2+dx)*scale,py=(b*h-(p.groundY||h)+dy)*scale,c=Math.cos(p.lean),sn=Math.sin(p.lean);
      return [px*c-py*sn,px*sn+py*c];
    };
    const q=point(u,v),anchor=point((p.contactX||w*.5)/w,(p.groundY||h)/h);
    out[0]=x+q[0];out[1]=floor+q[1]-anchor[1];return out;
  }
  const scratch=new Float32Array(2);
  // 16 connected bands also work for local file textures and unavailable WebGL.
  function canvasMesh(ctx,image,x,floor,scale,p){
    const w=image.width,h=image.height,rows=16,points=[];
    for(let j=0;j<=rows;j++)for(let i=0;i<2;i++){const q=[0,0];project(i,j/rows,w,h,p,x,floor,scale,q);points.push(q);}
    function triangle(a,b,c,A,B,C,sy,sh){
      const det=a[0]*(b[1]-c[1])+b[0]*(c[1]-a[1])+c[0]*(a[1]-b[1]);
      const affine=vals=>[(vals[0]*(b[1]-c[1])+vals[1]*(c[1]-a[1])+vals[2]*(a[1]-b[1]))/det,(vals[0]*(c[0]-b[0])+vals[1]*(a[0]-c[0])+vals[2]*(b[0]-a[0]))/det,(vals[0]*(b[0]*c[1]-c[0]*b[1])+vals[1]*(c[0]*a[1]-a[0]*c[1])+vals[2]*(a[0]*b[1]-b[0]*a[1]))/det];
      const xx=affine([A[0],B[0],C[0]]),yy=affine([A[1],B[1],C[1]]),cx=(A[0]+B[0]+C[0])/3,cy=(A[1]+B[1]+C[1])/3;
      ctx.save();ctx.beginPath();for(const [i,q]of [A,B,C].entries()){const dx=q[0]-cx,dy=q[1]-cy,k=1+.65/Math.max(1,Math.hypot(dx,dy));i?ctx.lineTo(cx+dx*k,cy+dy*k):ctx.moveTo(cx+dx*k,cy+dy*k);}ctx.closePath();ctx.clip();ctx.transform(xx[0],yy[0],xx[1],yy[1],xx[2],yy[2]);ctx.drawImage(image,0,sy,w,sh,0,sy,w,sh);ctx.restore();
    }
    for(let j=0;j<rows;j++){
      const y=j*h/rows,y2=(j+1)*h/rows,sy=Math.max(0,y-2),sh=Math.min(h,y2+2)-sy,A=points[j*2],B=points[j*2+1],C=points[j*2+2],D=points[j*2+3];
      triangle([0,y],[w,y],[0,y2],A,B,C,sy,sh);triangle([w,y],[w,y2],[0,y2],B,D,C,sy,sh);
    }
    return 32;
  }

  function create(){
    const canvas=document.createElement('canvas');
    const gl=canvas.getContext('webgl',{alpha:true,antialias:false,depth:false,stencil:false,premultipliedAlpha:true,preserveDrawingBuffer:false});
    if(!gl)return null;
    let lost=false;canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();lost=true;});
    function shader(type,code){const s=gl.createShader(type);gl.shaderSource(s,code);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error('Shader');return s;}
    const program=gl.createProgram();
    gl.attachShader(program,shader(gl.VERTEX_SHADER,'attribute vec2 p;attribute vec2 uv;uniform vec2 viewport;varying vec2 v;void main(){v=uv;gl_Position=vec4(p.x/viewport.x*2.0-1.0,1.0-p.y/viewport.y*2.0,0.0,1.0);}'));
    gl.attachShader(program,shader(gl.FRAGMENT_SHADER,'precision mediump float;varying vec2 v;uniform sampler2D picture;void main(){gl_FragColor=texture2D(picture,v);}'));
    gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error('Program');gl.useProgram(program);
    const cols=6,rows=16,count=(cols+1)*(rows+1),positions=new Float32Array(count*2),uv=new Float32Array(count*2),indices=new Uint16Array(cols*rows*6);
    for(let j=0;j<=rows;j++)for(let i=0;i<=cols;i++){const n=(j*(cols+1)+i)*2;uv[n]=i/cols;uv[n+1]=j/rows;}
    let n=0;for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){const a=j*(cols+1)+i,b=a+1,c=a+cols+1,d=c+1;indices.set([a,b,c,b,d,c],n);n+=6;}
    const posBuffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,posBuffer);gl.bufferData(gl.ARRAY_BUFFER,positions.byteLength,gl.DYNAMIC_DRAW);
    const posAttribute=gl.getAttribLocation(program,'p');gl.enableVertexAttribArray(posAttribute);gl.vertexAttribPointer(posAttribute,2,gl.FLOAT,false,0,0);
    const uvBuffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,uvBuffer);gl.bufferData(gl.ARRAY_BUFFER,uv,gl.STATIC_DRAW);
    const uvAttribute=gl.getAttribLocation(program,'uv');gl.enableVertexAttribArray(uvAttribute);gl.vertexAttribPointer(uvAttribute,2,gl.FLOAT,false,0,0);
    const indexBuffer=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,indexBuffer);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,indices,gl.STATIC_DRAW);
    const viewport=gl.getUniformLocation(program,'viewport'),textures=new Map();gl.uniform1i(gl.getUniformLocation(program,'picture'),0);
    gl.disable(gl.DEPTH_TEST);gl.disable(gl.BLEND);gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,true);
    const smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};
    return {
      draw(ctx,image,x,floor,scale,p){
        if(lost)return false;
        const ratio=ctx.getTransform().a,width=ctx.canvas.width/ratio,height=ctx.canvas.height/ratio;
        const dpr=Math.min(ratio,1.5),cw=Math.max(1,Math.round(width*dpr)),ch=Math.max(1,Math.round(height*dpr));
        if(canvas.width!==cw||canvas.height!==ch){canvas.width=cw;canvas.height=ch;gl.viewport(0,0,cw,ch);}
        gl.useProgram(program);gl.uniform2f(viewport,width,height);
        let t=textures.get(image);
        if(!t){
          if(textures.size>=6){const [key,value]=textures.entries().next().value;gl.deleteTexture(value);textures.delete(key);}
          t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
          let source=image;const k=Math.min(1,1024/Math.max(image.width,image.height));
          if(k<1){source=document.createElement('canvas');source.width=Math.round(image.width*k);source.height=Math.round(image.height*k);source.getContext('2d').drawImage(image,0,0,source.width,source.height);}
          gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,source);textures.set(image,t);
        }else gl.bindTexture(gl.TEXTURE_2D,t);
        const w=image.width,h=image.height;
        for(let j=0;j<=rows;j++)for(let i=0;i<=cols;i++){
          project(i/cols,j/rows,w,h,p,x,floor,scale,scratch);const n=(j*(cols+1)+i)*2;positions[n]=scratch[0];positions[n+1]=scratch[1];
        }
        gl.bindBuffer(gl.ARRAY_BUFFER,posBuffer);gl.bufferSubData(gl.ARRAY_BUFFER,0,positions);gl.vertexAttribPointer(posAttribute,2,gl.FLOAT,false,0,0);
        gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);gl.drawElements(gl.TRIANGLES,indices.length,gl.UNSIGNED_SHORT,0);
        ctx.drawImage(canvas,0,0,width,height);return true;
      }
    };
  }
  window.RR_MESH=Object.freeze({canvasMesh,project,draw(...args){
    if(failed)return false;
    try{if(!device){device=create();if(!device){failed=true;return false;}}return device.draw(...args);}catch{failed=true;return false;}
  }});
})();

/* Funções puras: coordenadas de células, quatro rotações e encaixe. */
window.Polyomino = (() => {
  'use strict';
  function rotations(matrix) {
    let rows=matrix.slice();const result=[];
    for(let turn=0;turn<4;turn++) {
      const w=rows[0].length,h=rows.length,cells=[];
      if(rows.some(row=>row.length!==w||/[^.#]/.test(row)))throw Error('Matriz inválida');
      for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(rows[y][x]==='#')cells.push(x,y);
      if(!cells.length)throw Error('Peça vazia');result.push({w,h,cells,rows});
      // Rotação horária: (x,y) vira (altura-1-y,x); a caixa troca largura por altura.
      rows=Array.from({length:w},(_,y)=>Array.from({length:h},(_,x)=>rows[h-1-x][y]).join(''));
    }
    return result;
  }
  function valid(board,cols,rows,shape,col,row) {
    // Cada célula ocupada precisa ficar dentro da grade e encontrar -1 (livre).
    for(let i=0;i<shape.cells.length;i+=2) {
      const x=col+shape.cells[i],y=row+shape.cells[i+1];
      if(x<0||y<0||x>=cols||y>=rows||board[y*cols+x]!==-1)return false;
    }
    return true;
  }
  function prepare(data) {
    const pieces={};for(const id of Object.keys(data.pieces))pieces[id]={...data.pieces[id],rotations:rotations(data.pieces[id].matrix)};
    const cycles=data.cycles.map((cycle,index)=>{
      const ascii=cycle.solution.map(row=>row.join(' ')).join('\n');
      function fail(reason){throw Error(`Ponte ${index+1}: ${reason}\n${ascii}`);}
      const {cols,rows,solution}=cycle,placements=[],board=new Int8Array(cols*rows).fill(-1);
      if(solution.length!==rows||solution.some(row=>row.length!==cols))fail('dimensões incorretas');
      if(new Set(cycle.pieces).size!==cycle.pieces.length||cycle.pieces.length>127)fail('índices de peças inválidos');
      for(const id of cycle.pieces) {
        if(!pieces[id])fail(`peça ${id} desconhecida`);
        let minX=cols,minY=rows,maxX=-1,maxY=-1,count=0;
        for(let y=0;y<rows;y++)for(let x=0;x<cols;x++)if(solution[y][x]===id){minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);count++;}
        const rotation=pieces[id].rotations.findIndex(r=>r.w===maxX-minX+1&&r.h===maxY-minY+1&&r.cells.length===count*2&&r.cells.every((v,i)=>i%2||solution[minY+r.cells[i+1]][minX+v]===id));
        if(rotation<0)fail(`peça ${id} não corresponde a uma rotação`);
        const shape=pieces[id].rotations[rotation];if(!valid(board,cols,rows,shape,minX,minY))fail(`sobreposição em ${id}`);
        for(let j=0;j<shape.cells.length;j+=2)board[(minY+shape.cells[j+1])*cols+minX+shape.cells[j]]=placements.length;
        placements.push({id,rotation,col:minX,row:minY});
      }
      if(board.includes(-1))fail('cobertura incompleta ou peça desconhecida');
      return {...cycle,placements};
    });
    return {pieces,cycles};
  }
  return Object.freeze({rotations,valid,prepare});
})();

//Audio====================================================
const coletaSound = document.getElementById('passos');
const binSound = document.getElementById("binSound");





//TABULEIRO================================================================================
const table={

    altura: 5,
    largura: 7,
    trashList: [],
    renderiza:(a=table.altura, l=table.largura)=>{

        let object=document.querySelector("#table");
        object.style.gridTemplateColumns=`repeat(${l}, 100px)`;

        for (let i=0; i < (l*a); i++) {

            let element=document.createElement("div");
            element.classList.add("block");
            object.appendChild(element);

        }

    },
    
    addTrash:(left, topo, tipo)=>{
        let element=document.createElement('article');
        element.classList.add('trash');
        element.style.top=`${topo}px`;
        element.style.left=`${left}px`;

        let img = document.createElement("img")

        switch (tipo) {
            case 0:
                img.src='../../../game_assets/lixo/papel.webp';
                break;
            case 1:
                img.src='../../../game_assets/lixo/sacola.webp';
                break;
            case 2:
                img.src='../../../game_assets/lixo/lata.webp';
                break;
        
            default:
                break;
        }


        element.appendChild(img)
        let object=document.querySelector("#table");
        object.appendChild(element);


        table.trashList.push({
            object:element,
            tipo:tipo,
            top:topo,
            left:left,
            onTable: true
        })
    }
}

function sortearNumeroInteiro(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}


function renderRandonTrash(count, tipo){
    i=0
    while(i<count){
        let x=sortearNumeroInteiro(0, 6);
        let y=sortearNumeroInteiro(0, 4)

        let free = true
        table.trashList.forEach((trash)=>{
            if(trash.top===(y*103) && trash.left===(x*103) || (x===0 && (y===0 || y===1 || y===2))){
                free = false;
            }
        })

        if(free){
            table.addTrash((x*103), (y*103), tipo);
            i++;
        }
    }
}


//LIXEIRAS=============================================================================================


const lixeiras={

    list:[],
    add:(tipo)=>{
        let element = document.createElement("article")
        element.classList.add('bin');
        
        let top=((lixeiras.list.length)*103);
        element.style.top=`${top}px`;

        element.style.left=`${(-1*103)}px`;

        let img = document.createElement("img");


        if(tipo===0){
            img.src="https://cdn-icons-png.flaticon.com/512/5142/5142514.webp"
        }

        switch (tipo) {
            case 0:
                img.src="../../../game_assets/lixeiras/lixeira_papel.webp"
                break;
            case 1:
                img.src="../../../game_assets/lixeiras/lixeira_plastico.webp"
                break;
            case 2:
                img.src="../../../game_assets/lixeiras/lixeira_metal.webp"
                break;
        
        }

        let placar = document.createElement("div");
        placar.innerText='0';


        element.appendChild(img);
        element.appendChild(placar)

        let object=document.querySelector("#table");
        object.appendChild(element);

        lixeiras.list.push({
            object: element,
            tipo: tipo,
            count: 0,
            placar: placar,
            top: top,
            
        })

    }
}




/*
count: 0,
    add:(number)=>{
        //let object=document.querySelector("#lixo_count");
        lixeira.count+=number;

        //object.textContent=`${lixeira.count}`
    }
*/



// const trash={
//     object:document.querySelector(".trash"),
//     top:106,
//     left: 212,
//     onTable: true
// }






// trash.object.style.left=`${trash.left}px`
// trash.object.style.top=`${trash.top}px`




//PERSONAGEM===================================================================================
const character={
    object:document.querySelector("#character"),
    imgObj:document.querySelector("#character>img"),
    top:0,
    left:0,
    papel: 0,
    metal: 0,
    plastico: 0,
    frontSprite: "../../../game_assets/marcio/front.webp",
    backSprite: "../../../game_assets/marcio/back.webp",
    rightSprite: "../../../game_assets/marcio/right.webp",
    leftSprite: "../../../game_assets/marcio/left.webp"
}

//MENSAGEM========================================================================================

function addMensagem(msg){
    
    let msgCont = document.querySelector(".message_cont");
    let msgObj = document.createElement('div');
    let p = document.createElement("p");

    p.innerHTML=msg;
    
    
    msgObj.classList.add('message');
    msgObj.appendChild(p);
    

    msgCont.appendChild(msgObj);
    

    setTimeout(()=>{msgObj.style.display='none'}, 6000)
    
}






//FUNÇÃO PARA VERIFICAR COLETA===========================================================================
function verificaColeta(){
    

    table.trashList.forEach((trash)=>{
        
        if(character.top===trash.top && character.left===trash.left && trash.onTable){
        

            if(trash.tipo===0 && character.metal===0 && character.plastico===0){
                trash.object.style.display='none';
                trash.onTable=false;
                character.papel++;
                coletaSound.currentTime = 0.53;
                coletaSound.play();
            }else if(trash.tipo===1 && character.metal===0 && character.papel===0){
                trash.object.style.display='none';
                trash.onTable=false;
                character.plastico++;
                coletaSound.currentTime = 0.53;
                coletaSound.play();
            }if(trash.tipo===2 && character.papel===0 && character.plastico===0){
                trash.object.style.display='none';
                trash.onTable=false;
                character.metal++;
                coletaSound.currentTime = 0.53;
                coletaSound.play();
            }
            
        }

    })
}

function verificaVitoria(){
    let limpo=true
    table.trashList.forEach((trash)=>{
        if(trash.onTable){
            limpo=false
        }

    })

    if(limpo && character.papel===0 && character.plastico===0 && character.metal===0){
        let popup=document.getElementById("vitoriaPopup");
        popup.style.display='flex';
    }
}


//Botão para fechar o popup de tutorial================================================
const tutorialPopup = document.getElementById("tutorialPopup");
const tutorialBtn = document.getElementById("popTutorialBtn");

tutorialBtn.addEventListener("click", ()=>{
    tutorialPopup.style.display="none";
})






//MOVIMENTA ÇÃO DO PERSONAGEM=========================================================================
document.addEventListener('keydown', (key)=>{
      

    if(key.code==='ArrowRight'){
        if(character.left<(table.largura-1)*103){
            character.left+=103;
            character.object.style.left=`${character.left}px`;
        };

        character.imgObj.src = character.rightSprite;
        

    }else if(key.code==='ArrowLeft'){

        if(character.left>0){
            character.left-=103;
            character.object.style.left=`${character.left}px`;
        };

        character.imgObj.src = character.leftSprite;
        
    
    }else if(key.code==='ArrowDown'){

        if(character.top<(table.altura-1)*103){
            character.top+=103;
            character.object.style.top=`${character.top}px`;
        };

        character.imgObj.src = character.frontSprite;
        
    
    }else if(key.code==='ArrowUp'){

        if(character.top>0){
            character.top-=103;
            character.object.style.top=`${character.top}px`;
        };

        character.imgObj.src = character.backSprite;
        
 
    }else if(key.code=='Enter' && character.left===0 && (character.plastico>0 || character.papel>0 || character.metal>0)){

        

        lixeiras.list.forEach((bin)=>{

            if(bin.top===character.top ){


                if(bin.tipo===0){
                    if(character.plastico>0){
                        addMensagem("plásticco vai na lixeira VERMELHA")
                    }else if(character.metal>0){
                        addMensagem("metal vai na lixeira AMARELA")
                    }else{
                        bin.count+=character.papel;
                        bin.placar.innerText=bin.count;
                        character.papel=0;
                        binSound.play();
                    }
                    

                }else if(bin.tipo===1){
                    if(character.papel>0){
                        addMensagem("papel vai na lixeira AZUL")
                    }else if(character.metal>0){
                        addMensagem("metal vai na lixeira AMARELA")
                    }else{
                        bin.count+=character.plastico;
                        bin.placar.innerText=bin.count;
                        character.plastico=0;
                        binSound.play();
                    }

                }else if(bin.tipo===2){
                    if(character.plastico>0){
                        addMensagem("plásticco vai na lixeira VERMELHA")
                    }else if(character.papel>0){
                        addMensagem("papel vai na lixeira AZUL")
                    }else{
                        bin.count+=character.metal;
                        bin.placar.innerText=bin.count;
                        character.metal=0;
                        binSound.play();
                    }
                }
            }
        })
        
        
        verificaVitoria();
    }

    

    verificaColeta();
    console.log(`papel: ${character.papel}`);
    console.log(`plastico: ${character.plastico}`);
    console.log(`metal: ${character.metal}`);

    

})
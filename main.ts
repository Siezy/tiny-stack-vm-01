import{readdirSync as R,readFileSync as F,mkdirSync as K,writeFileSync as W}from'node:fs';
const T="0Aa46:;?........999999959995999.999.............PTTP0...........58..............4414",G=[0,1,2,4],
B=[(a,b)=>a+b,(a,b)=>a-b,Math.imul,(a,b)=>a/b,(a,b)=>a%b,(a,b)=>(a>>>0)/(b>>>0),(a,b)=>(a>>>0)%(b>>>0),,(a,b)=>a&b,(a,b)=>a|b,(a,b)=>a^b,,(a,b)=>a<<(b&31),(a,b)=>a>>(b&31),(a,b)=>a>>>(b&31),,(a,b)=>+(a===b),(a,b)=>+(a<b),(a,b)=>+((a>>>0)<(b>>>0))];
function run(p,q){
const n=p.length,D=new Int32Array(256),C=new Int32Array(64),M=new Int32Array(256);
let s=0,c=0,o='',i=0,pc=0,st=0;
const E=x=>[Buffer.from(o,'latin1'),x];
for(;;){
if(st===1e6)return E(10);
if(pc<0||pc>=n)return E(9);
const op=p[pc],v=T.charCodeAt(op)-48;
if(!(v>=0&&v<64))return E(5);
const im=G[v>>4],po=v>>2&3,pu=v&3;
if(pc+im>=n)return E(9);
st++;
let nx=pc+1+im;
if(s<po)return E(2);
if(s-po+pu>256)return E(3);
switch(op){
case 0:return E(0);
case 1:D[s++]=(p[pc+1]<<24)>>24;break;
case 2:D[s++]=p[pc+1]|p[pc+2]<<8|p[pc+3]<<16|p[pc+4]<<24;break;
case 3:s--;break;
case 4:case 6:D[s]=D[s-1-(op==6)];s++;break;
case 5:{const t=D[s-1];D[s-1]=D[s-2];D[s-2]=t;break;}
case 7:{const t=D[s-3];D[s-3]=D[s-2];D[s-2]=D[s-1];D[s-1]=t;break;}
case 23:D[s-1]=-D[s-1];break;
case 27:D[s-1]=~D[s-1];break;
case 48:case 49:case 50:{const r=(p[pc+1]|p[pc+2]<<8)<<16>>16;if(op==48||!!D[--s]==(op==50))nx+=r;break;}
case 51:if(c==64)return E(7);C[c++]=nx;nx=p[pc+1]|p[pc+2]<<8;break;
case 52:if(!c)return E(8);nx=C[--c];break;
case 64:case 65:{const a=D[s-1];if(a>>>0>255)return E(6);if(op==64)D[s-1]=M[a];else{M[a]=D[s-2];s-=2;}break;}
case 80:{const t=''+D[s-1];if(o.length+t.length>65536)return E(11);o+=t;s--;break;}
case 81:if(o.length==65536)return E(11);o+=String.fromCharCode(D[--s]&255);break;
case 82:D[s++]=i<q.length?q[i++]:-1;break;
case 83:return E(D[--s]&255);
default:{const b=D[s-1];if(op>18&&op<23&&!b)return E(4);D[s-=2]=B[op-16](D[s],b);s++;}
}
pc=nx;
}
}
const{MAKEFUN_INPUT_DIR:I='/input',MAKEFUN_OUTPUT_DIR:O='/output'}=process.env;
for(const id of R(I)){
const[o,c]=run(F(`${I}/${id}/program.bin`),F(`${I}/${id}/input.bin`));
K(`${O}/${id}`,{recursive:!0});
W(`${O}/${id}/stdout.bin`,o);
W(`${O}/${id}/exit.txt`,c+'\n');
}

// tiny-stack-vm-01 v2, re-authored in-session by Yanto (Muse) from Badru's design.
// Exact stack VM (ISA v1): same step/pc/opcode/imm/stack check order and traps as the kit reference.
// Op metadata packs (imm,pops,pushes) per opcode byte; binary arith lives in F, indexed by op-16.
import{readdirSync as ls,readFileSync as rd,mkdirSync as mk,writeFileSync as wr}from'node:fs';
const T="0Aa46:;?........999999959995999.999.............PTTP0...........58..............4414",Z=[0,1,2,4],
F=[(a,b)=>a+b,(a,b)=>a-b,Math.imul,(a,b)=>a/b,(a,b)=>a%b,(a,b)=>(a>>>0)/(b>>>0),(a,b)=>(a>>>0)%(b>>>0),,(a,b)=>a&b,(a,b)=>a|b,(a,b)=>a^b,,(a,b)=>a<<(b&31),(a,b)=>a>>(b&31),(a,b)=>a>>>(b&31),,(a,b)=>+(a===b),(a,b)=>+(a<b),(a,b)=>+((a>>>0)<(b>>>0))];
function run(P,Q){
const N=P.length,S=new Int32Array(256),R=new Int32Array(64),Y=new Int32Array(256);
let k=0,j=0,u='',t=0,x=0,w=0;
const V=c=>[Buffer.from(u,'latin1'),c];
for(;;){
if(w===1e6)return V(10);
if(x<0||x>=N)return V(9);
const z=P[x],e=T.charCodeAt(z)-48;
if(!(e>=0&&e<64))return V(5);
const g=Z[e>>4],d=e>>2&3,h=e&3;
if(x+g>=N)return V(9);
w++;
let m=x+1+g;
if(k<d||k-d+h>256)return V(k<d?2:3);
switch(z){
case 0:return V(0);
case 1:S[k++]=(P[x+1]<<24)>>24;break;
case 2:S[k++]=P[x+1]|P[x+2]<<8|P[x+3]<<16|P[x+4]<<24;break;
case 3:k--;break;
case 4:case 6:S[k]=S[k-1-(z==6)];k++;break;
case 5:{const s=S[k-1];S[k-1]=S[k-2];S[k-2]=s;break;}
case 7:{const s=S[k-3];S[k-3]=S[k-2];S[k-2]=S[k-1];S[k-1]=s;break;}
case 23:S[k-1]=-S[k-1];break;
case 27:S[k-1]=~S[k-1];break;
case 48:case 49:case 50:{const r=(P[x+1]|P[x+2]<<8)<<16>>16;if(z==48||!!S[--k]==(z==50))m+=r;break;}
case 51:if(j==64)return V(7);R[j++]=m;m=P[x+1]|P[x+2]<<8;break;
case 52:if(!j)return V(8);m=R[--j];break;
case 64:case 65:{const a=S[k-1];if(a>>>0>255)return V(6);if(z==64)S[k-1]=Y[a];else{Y[a]=S[k-2];k-=2;}break;}
case 80:{const s=''+S[k-1];if(u.length+s.length>65536)return V(11);u+=s;k--;break;}
case 81:if(u.length==65536)return V(11);u+=String.fromCharCode(S[--k]&255);break;
case 82:S[k++]=t<Q.length?Q[t++]:-1;break;
case 83:return V(S[--k]&255);
default:{const b=S[k-1];if(z>18&&z<23&&!b)return V(4);S[k-=2]=F[z-16](S[k],b);k++;}
}
x=m;
}
}
const{MAKEFUN_INPUT_DIR:I='/input',MAKEFUN_OUTPUT_DIR:O='/output'}=process.env;
for(const id of ls(I)){
const[U,C]=run(rd(`${I}/${id}/program.bin`),rd(`${I}/${id}/input.bin`));
mk(`${O}/${id}`,{recursive:!0});
wr(`${O}/${id}/stdout.bin`,U);
wr(`${O}/${id}/exit.txt`,C+'\n');
}

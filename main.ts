// tiny-stack-vm-01 v2, re-authored in-session by Yanto (Muse) from Badru's design.
// Exact stack VM (ISA v1): same step/pc/opcode/imm/stack check order and traps as the kit reference.
// Op metadata packs (imm,pops,pushes) per opcode byte; binary arith lives in F, indexed by op-16.
// Output accumulates in a fixed Uint8Array like the reference VM, instead of a string.
import{readdirSync as ls,readFileSync as rd,mkdirSync as mk,writeFileSync as wr}from'node:fs';
const T="0Aa46:;?........999999959995999.999.............PTTP0...........58..............4414",Z=[0,1,2,4],
F=[(a,b)=>a+b,(a,b)=>a-b,Math.imul,(a,b)=>a/b,(a,b)=>a%b,(a,b)=>(a>>>0)/(b>>>0),(a,b)=>(a>>>0)%(b>>>0),,(a,b)=>a&b,(a,b)=>a|b,(a,b)=>a^b,,(a,b)=>a<<(b&31),(a,b)=>a>>(b&31),(a,b)=>a>>>(b&31),,(a,b)=>+(a===b),(a,b)=>+(a<b),(a,b)=>+((a>>>0)<(b>>>0))];
function run(P,Q){
const N=P.length,S=new Int32Array(256),R=new Int32Array(64),Y=new Int32Array(256),Ob=new Uint8Array(65536);
let k=0,j=0,ol=0,t=0,x=0,w=0;
const V=c=>[Buffer.from(Ob.subarray(0,ol)),c];
for(;;){
if(w===1e6||x<0||x>=N)return V(w===1e6?10:9);
const z=P[x],e=T.charCodeAt(z)-48;
if(!(e>=0&&e<64))return V(5);
const g=Z[e>>4],d=e>>2&3,h=e&3;
if(x+g>=N)return V(9);
w++;
let m=x+1+g;
const r=z>=48&&z<51?(P[x+1]|P[x+2]<<8)<<16>>16:0;
if(k<d||k-d+h>256)return V(k<d?2:3);
switch(z){
case 0:return V(0);
case 1:{S[k++]=(P[x+1]<<24)>>24;break;}
case 2:{S[k++]=P[x+1]|P[x+2]<<8|P[x+3]<<16|P[x+4]<<24;break;}
case 3:{k--;break;}
case 4:{S[k]=S[k-1];k++;break;}
case 5:{const s=S[k-1];S[k-1]=S[k-2];S[k-2]=s;break;}
case 6:{S[k]=S[k-2];k++;break;}
case 7:{const s=S[k-3];S[k-3]=S[k-2];S[k-2]=S[k-1];S[k-1]=s;break;}
case 23:{S[k-1]=-S[k-1];break;}
case 27:{S[k-1]=~S[k-1];break;}
case 48:{m+=r;break;}
case 49:{if(S[--k]==0)m+=r;break;}
case 50:{if(S[--k]!=0)m+=r;break;}
case 51:{const a=P[x+1]|P[x+2]<<8;if(j==64)return V(7);R[j++]=m;m=a;break;}
case 52:{if(j==0)return V(8);m=R[--j];break;}
case 64:{const a=S[k-1];if(a>>>0>255)return V(6);S[k-1]=Y[a];break;}
case 65:{const a=S[k-1];if(a>>>0>255)return V(6);Y[a]=S[k-2];k-=2;break;}
case 80:{const y=Buffer.from(''+S[k-1]);if(ol+y.length>65536)return V(11);Ob.set(y,ol);ol+=y.length;k--;break;}
case 81:{if(ol==65536)return V(11);Ob[ol++]=S[--k]&255;break;}
case 82:{S[k++]=t<Q.length?Q[t++]:-1;break;}
case 83:return V(S[--k]&255);
default:{const b=S[k-1];if(z>18&&z<23&&!b)return V(4);S[k-=2]=F[z-16](S[k],b);k++;}
}
x=m;
}
}
const{MAKEFUN_INPUT_DIR:ID='/input',MAKEFUN_OUTPUT_DIR:OD='/output'}=process.env;
for(const id of ls(ID)){
const[U,C]=run(rd(`${ID}/${id}/program.bin`),rd(`${ID}/${id}/input.bin`));
mk(`${OD}/${id}`,{recursive:!0});
wr(`${OD}/${id}/stdout.bin`,U);
wr(`${OD}/${id}/exit.txt`,C+'\n');
}

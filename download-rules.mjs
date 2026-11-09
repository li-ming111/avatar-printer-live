export function addRulesDownload(root){
 const button=document.createElement('button');button.type='button';button.className='secondary';button.textContent='下载规则图 PNG';button.style.cssText='width:100%;margin-top:14px';
 const status=document.createElement('div');status.setAttribute('role','status');status.style.cssText='font-size:12px;color:#9fb3c8;margin-top:6px;line-height:1.6';
 root.after(button,status);
 button.onclick=async()=>{
  button.disabled=true;status.textContent='正在生成透明背景 PNG…';
  try{
   await document.fonts.ready;
   const rows=await Promise.all([...root.querySelectorAll('.rule-row')].map(async row=>{
    const img=row.querySelector('img');if(img)await img.decode();
    return {img,text:[...row.querySelectorAll('b,span')].map(n=>n.textContent.trim()).join(' ')};
   }));
   const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');
   const font='800 54px "Microsoft YaHei", sans-serif';ctx.font=font;
   const width=Math.ceil(Math.max(...rows.map(r=>ctx.measureText(r.text).width+(r.img?116:0)))+48);
   const height=rows.length*120+32;
   canvas.width=width*2;canvas.height=height*2;ctx.scale(2,2);ctx.font=font;ctx.textBaseline='middle';ctx.fillStyle='#ffe327';
   for(let i=0;i<rows.length;i++){
    const {img,text}=rows[i],y=16+i*120;
    if(img){const scale=Math.min(96/img.naturalWidth,96/img.naturalHeight);const w=img.naturalWidth*scale,h=img.naturalHeight*scale;ctx.drawImage(img,24+(96-w)/2,y+(120-h)/2,w,h)}
    ctx.save();ctx.shadowColor='#8c6800';ctx.shadowOffsetY=2;ctx.shadowBlur=2;ctx.fillText(text,img?140:24,y+60);ctx.restore();
   }
   const data=canvas.toDataURL('image/png');
   if(window.pywebview?.api?.save_rules_png){const result=await window.pywebview.api.save_rules_png(data);status.textContent=result;}
   else{const link=document.createElement('a');link.href=data;link.download='直播打印规则.png';document.body.append(link);link.click();link.remove();status.textContent='PNG 下载已开始（透明背景）。'}
  }catch(e){status.textContent='下载失败：'+e.message}finally{button.disabled=false}
 };
}

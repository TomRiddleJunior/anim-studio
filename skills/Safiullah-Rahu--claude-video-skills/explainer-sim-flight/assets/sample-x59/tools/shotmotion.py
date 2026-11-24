import glob, numpy as np
from PIL import Image
files=sorted(glob.glob('shots/frames/f_*.jpg')); fps=6
prev=None; d=[]
for f in files:
    sm=np.asarray(Image.open(f).convert('RGB').resize((160,90),Image.BOX)).astype(np.int16)
    g=(sm[...,0]*0.299+sm[...,1]*0.587+sm[...,2]*0.114).astype(np.int16)
    d.append(0 if prev is None else float(np.abs(g-prev).mean())); prev=g
d=np.array(d)
cuts=[0,3.66,9.0,12.61,16.39,18.25,20.4,23.29,24.92,28.34,30.43,34.87,37.92,40.43,45.49,47.67,53.04,55.7,58.45,63.9,67.09,70.16,75.29,79.85,84.36,88.37,93.2,95.26,99]
names="desert-chase hills-reveal airliner runway-fighter pines-pass pines-mist pines-tops canopy-shape desert-merge canopy-boom rocky clouds-shocks clouds-engine clouds-thump high-cockpit river-xvs river-fast river-chase dusk-town dusk-mics snow desert-f5 runway-x59 high-chase high-f15 high-cruise mics-end desert-end".split()
tot=0
for i in range(len(cuts)-1):
    a=int(cuts[i]*fps)+2; b=int(cuts[i+1]*fps)-1
    m=d[a:b].mean(); tot+=m*(cuts[i+1]-cuts[i])
    print(f"{names[i]:15s} {cuts[i+1]-cuts[i]:5.2f}s motion {m:5.1f}")
print("cut-spikes contribute", round(d.mean()*99 - tot,1), "of", round(d.mean()*99,1))

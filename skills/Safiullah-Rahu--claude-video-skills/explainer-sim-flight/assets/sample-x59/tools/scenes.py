import glob, sys, numpy as np
from PIL import Image
files=sorted(glob.glob('shots/frames/f_*.jpg')); fps=6
H=[]
for f in files:
    sm=np.asarray(Image.open(f).convert('RGB').resize((160,90),Image.BOX))
    q=(sm>>6).astype(np.int32); H.append(np.bincount((q[...,0]*16+q[...,1]*4+q[...,2]).ravel(),minlength=64)/q[...,0].size)
H=np.array(H); d=0.5*np.abs(H[fps:]-H[:-fps]).sum(axis=1)
ev,last=[],-9
for i in range(1,len(d)-1):
    t=(i+fps/2)/fps
    if d[i]>=0.28 and d[i]>=d[i-1] and d[i]>=d[i+1] and t-last>=1.5: ev.append(round(t,2)); last=t
print('events',ev)
print('lens',np.round(np.diff([0]+ev+[99]),2).tolist())
cuts=[float(x) for x in sys.argv[1:]]
for c in cuts:
    i=int(round((c-0.5)*fps)); 
    if 0<=i<len(d): print(f'cut {c:6.2f}  d={d[max(0,i-3):i+4].max():.2f}')

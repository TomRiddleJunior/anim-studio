import numpy as np, soundfile as sf, json, sys
vo=json.load(open('data/vo.json',encoding='utf-8'))
m,sr=sf.read('audio/music.wav'); f,_=sf.read('audio/final.wav'); x,_=sf.read('audio/sfx.wav'); mix,_=sf.read('audio/mix_raw.wav')
mm=m.mean(1); fm=f.mean(1); xm=x.mean(1); mx=mix.mean(1)
def db(a): return 20*np.log10(np.sqrt((a**2).mean())+1e-12)
def seg(a,t0,t1): return a[int(t0*sr):int(t1*sr)]
sp=np.zeros(len(mx),bool)
for l in vo['lines']: sp[int(l['start']*sr):int(l['end']*sr)]=True
voice=mx-mm[:len(mx)]-xm[:len(mx)]
print('voice rms (speech)', round(db(voice[sp]),1), ' music under speech after 56s', round(db(mm[:len(sp)][sp & (np.arange(len(sp))>56*sr)]),1))
for a,b,lab in [(10,20,'early (sfx+vo)'),(50,54,'c09'),(62,66,'c11'),(79.7,81,'heart+vo'),(81.7,83,'heart gap'),(84.45,85.7,'silence'),(85.8,86.6,'sting'),(87,89,'tail')]:
    print(f'{lab:16s} mix {db(seg(mx,a,b)):6.1f}  music {db(seg(mm,a,b)):6.1f}  sfx {db(seg(xm,a,b)):6.1f}  final {db(seg(fm,a,b)):6.1f}')

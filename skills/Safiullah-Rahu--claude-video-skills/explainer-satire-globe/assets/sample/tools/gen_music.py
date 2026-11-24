"""Instrumental music bed with MiniMax-Music3 through a running ComfyUI (http://127.0.0.1:8188), the official
"Text to Music (MiniMax Music 3)" graph as an API prompt (same graph as ev-remake/tools/gen_song.py).

  python -I tools/gen_music.py --seeds 7 19 --duration 150 [--steps 30] [--caption music/caption.txt]
Outputs: music/candidates/seed_<n>.flac (+ the prompt JSON and the elapsed time next to it).
"""
import argparse
import json
import shutil
import time
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
COMFY = Path(r"ComfyUI")
API = "http://127.0.0.1:8188"
LYRICS = "[intro]\n[inst]\n[verse]\n[inst]\n[chorus]\n[inst]\n[bridge]\n[inst]\n[chorus]\n[inst]\n[outro]\n[inst]"


def post(path, body):
    req = urllib.request.Request(API + path, data=json.dumps(body).encode(), headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.loads(r.read())


def get(path):
    with urllib.request.urlopen(API + path, timeout=60) as r:
        return json.loads(r.read())


def graph(caption, lyrics, seed, duration, steps, cfg, top_k, ar_cfg, prefix):
    return {
        "1": {"class_type": "UNETLoader", "inputs": {"unet_name": "minimax_music3_dit_fp16.safetensors", "weight_dtype": "default"}},
        "2": {"class_type": "CLIPLoader", "inputs": {"clip_name": "minimax_music3_text_encoder_pruned_int8_convrot.safetensors", "type": "minimax", "device": "default"}},
        "3": {"class_type": "VAELoader", "inputs": {"vae_name": "minimax_music3_dav.safetensors"}},
        "4": {"class_type": "MiniMaxMusic3TextEncode", "inputs": {"clip": ["2", 0], "caption": caption, "lyrics": lyrics, "seed": seed,
                                                                "max_duration": duration, "cfg_scale": ar_cfg, "top_k": top_k}},
        "5": {"class_type": "ConditioningZeroOut", "inputs": {"conditioning": ["4", 0]}},
        "6": {"class_type": "EmptyMiniMaxMusic3LatentAudio", "inputs": {"seconds": ["4", 1], "batch_size": 1}},
        "7": {"class_type": "KSampler", "inputs": {"model": ["1", 0], "positive": ["4", 0], "negative": ["5", 0], "latent_image": ["6", 0],
                                                  "seed": seed, "steps": steps, "cfg": cfg, "sampler_name": "euler", "scheduler": "simple", "denoise": 1.0}},
        "8": {"class_type": "VAEDecodeAudioTiled", "inputs": {"samples": ["7", 0], "vae": ["3", 0], "tile_size": 1536, "overlap": 64}},
        "9": {"class_type": "SaveAudio", "inputs": {"audio": ["8", 0], "filename_prefix": prefix}},
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--seeds", type=int, nargs="+", default=[7])
    ap.add_argument("--duration", type=float, default=150.0)
    ap.add_argument("--steps", type=int, default=30)
    ap.add_argument("--cfg", type=float, default=1.7)
    ap.add_argument("--ar-cfg", type=float, default=1.7)
    ap.add_argument("--top-k", type=int, default=50)
    ap.add_argument("--caption", default=str(ROOT / "music" / "caption.txt"))
    ap.add_argument("--tag", default="")
    a = ap.parse_args()
    caption = Path(a.caption).read_text(encoding="utf-8").strip()
    out = ROOT / "music" / "candidates"
    out.mkdir(parents=True, exist_ok=True)
    for seed in a.seeds:
        name = f"seed_{seed}{a.tag}"
        g = graph(caption, LYRICS, seed, a.duration, a.steps, a.cfg, a.top_k, a.ar_cfg, f"satire_globe/{name}")
        t0 = time.time()
        pid = post("/prompt", {"prompt": g})["prompt_id"]
        while True:
            time.sleep(5)
            h = get(f"/history/{pid}")
            if pid in h:
                st = h[pid].get("status", {})
                if st.get("status_str") == "error" or st.get("completed") is False and st.get("messages") and any(m[0] == "execution_error" for m in st["messages"]):
                    print(name, "ERROR", json.dumps(st)[:2000], flush=True)
                    break
                files = [f for o in h[pid]["outputs"].values() for f in o.get("audio", [])]
                if files:
                    f = files[0]
                    src = COMFY / "output" / f.get("subfolder", "") / f["filename"]
                    dst = out / (name + Path(f["filename"]).suffix)
                    shutil.copy2(src, dst)
                    el = time.time() - t0
                    (out / (name + ".json")).write_text(json.dumps({"prompt": g, "elapsed_s": round(el, 1)}, indent=1), encoding="utf-8")
                    print(name, "done", dst.name, f"{el:.0f}s", flush=True)
                    break


if __name__ == "__main__":
    main()

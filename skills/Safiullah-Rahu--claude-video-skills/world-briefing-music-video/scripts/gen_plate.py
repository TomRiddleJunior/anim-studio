"""Generate editorial plates with Qwen-Image 2.1 Turbo through a running ComfyUI (http://127.0.0.1:8188), following the
official Comfy-Org "image_qwen_image_2_1_turbo_t2i" template: EmptyLatentImage → SamplerCustomAdvanced (euler,
8 ManualSigmas, CFGGuider cfg 1, QwenImage21Cache auto) → VAEDecode.

  python tools/gen_plate.py plates.json [--only id1,id2] [--seeds 1 2] [--w 2048 --h 1152]
plates.json: [{"id": "ukraine", "prompt": "...", "seed": 11}, ...] — the house style suffix (STYLE) is appended.
Outputs plates/<id>__s<seed>.png (+ the prompt next to it).
"""
import argparse, json, shutil, time, urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
COMFY = Path(r"ComfyUI")
API = "http://127.0.0.1:8188"
SIGMAS = "1.0, 0.978453, 0.95418, 0.926626, 0.89508, 0.845148, 0.704534, 0.414568, 0"
STYLE = ("Editorial risograph illustration printed in two inks, deep navy blue and vermilion red, on warm off-white paper; "
         "visible halftone grain, slight ink misregistration and paper texture; bold simplified shapes with generous negative space; "
         "symbolic, restrained, documentary tone, like the cover illustration of a serious weekly news magazine. "
         "No text, no letters, no numbers, no logos, no readable signs, no flags with readable emblems, no recognizable real people, "
         "no gore. 16:9 widescreen composition with calm space on the left third for headline type.")


def post(path, body):
    req = urllib.request.Request(API + path, data=json.dumps(body).encode(), headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.loads(r.read())


def get(path):
    with urllib.request.urlopen(API + path, timeout=60) as r:
        return json.loads(r.read())


def graph(prompt, seed, w, h, prefix):
    return {
        "1": {"class_type": "UNETLoader", "inputs": {"unet_name": "qwen_image_2.1_turbo_int8_convrot.safetensors", "weight_dtype": "default"}},
        "2": {"class_type": "CLIPLoader", "inputs": {"clip_name": "qwen3vl_8b_int8_convrot.safetensors", "type": "qwen_image", "device": "default"}},
        "3": {"class_type": "VAELoader", "inputs": {"vae_name": "qwen_image_2.1_vae_bf16.safetensors"}},
        "4": {"class_type": "QwenImage21Cache", "inputs": {"model": ["1", 0], "device": "auto", "dtype": "default"}},
        "5": {"class_type": "TextEncodeQwenImage21", "inputs": {"clip": ["2", 0], "prompt": prompt, "negative_prompt": "", "resolution": 1024}},
        "6": {"class_type": "EmptyLatentImage", "inputs": {"width": w, "height": h, "batch_size": 1}},
        "7": {"class_type": "RandomNoise", "inputs": {"noise_seed": seed}},
        "8": {"class_type": "KSamplerSelect", "inputs": {"sampler_name": "euler"}},
        "9": {"class_type": "ManualSigmas", "inputs": {"sigmas": SIGMAS}},
        "10": {"class_type": "CFGGuider", "inputs": {"model": ["4", 0], "positive": ["5", 0], "negative": ["5", 1], "cfg": 1.0}},
        "11": {"class_type": "SamplerCustomAdvanced", "inputs": {"noise": ["7", 0], "guider": ["10", 0], "sampler": ["8", 0], "sigmas": ["9", 0], "latent_image": ["6", 0]}},
        "12": {"class_type": "VAEDecode", "inputs": {"samples": ["11", 0], "vae": ["3", 0]}},
        "13": {"class_type": "SaveImage", "inputs": {"images": ["12", 0], "filename_prefix": prefix}},
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("spec"); ap.add_argument("--only"); ap.add_argument("--seeds", type=int, nargs="*")
    ap.add_argument("--w", type=int, default=2048); ap.add_argument("--h", type=int, default=1152); ap.add_argument("--nostyle", action="store_true")
    a = ap.parse_args()
    items = json.loads(Path(a.spec).read_text(encoding="utf-8"))
    only = set(a.only.split(",")) if a.only else None
    out = ROOT / "plates"
    out.mkdir(exist_ok=True)
    for it in items:
        if only and it["id"] not in only:
            continue
        for seed in (a.seeds or [it.get("seed", 1)]):
            prompt = it["prompt"].strip() + ("" if a.nostyle or it.get("nostyle") else " " + STYLE)
            dst = out / f"{it['id']}__s{seed}.png"
            if dst.exists():
                print(f"{dst.name}: exists"); continue
            t0 = time.time()
            pid = post("/prompt", {"prompt": graph(prompt, seed, a.w, a.h, f"sotw/{it['id']}__s{seed}")})["prompt_id"]
            while True:
                time.sleep(2)
                hh = get(f"/history/{pid}")
                if pid in hh:
                    st = hh[pid].get("status", {})
                    if st.get("status_str") == "error":
                        raise SystemExit(f"{it['id']} failed: {json.dumps(st)[:1500]}")
                    for o in hh[pid]["outputs"].values():
                        for im in o.get("images", []):
                            shutil.copy2(COMFY / "output" / im.get("subfolder", "") / im["filename"], dst)
                    (out / f"{it['id']}__s{seed}.txt").write_text(prompt, encoding="utf-8")
                    print(f"{dst.name}: {time.time() - t0:.0f}s", flush=True)
                    break


if __name__ == "__main__":
    main()

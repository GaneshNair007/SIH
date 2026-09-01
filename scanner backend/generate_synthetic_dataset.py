import numpy as np, json

rng = np.random.default_rng(7)

logt_real = np.load('work/logt_real.npy')
frac_real = np.load('work/frac_real.npy')
bg_real = np.load('work/bg_real.npy')
spot_real = np.load('work/spot_real.npy')
frac_coeffs = np.load('work/frac_coeffs.npy')

def true_frac(logt):
    f = np.polyval(frac_coeffs, logt)
    return np.clip(f, 0.0, 0.95)

def interp_channel(logt, real_vals):
    order = np.argsort(logt_real)
    return np.interp(logt, logt_real[order], real_vals[order])

def true_spot_rgb(logt):
    return np.array([interp_channel(logt, spot_real[:,k]) for k in range(3)])

def true_bg_rgb(logt):
    return np.array([interp_channel(logt, bg_real[:,k]) for k in range(3)])

def rgb_to_lab_batch(rgb):
    # rgb: (...,3) in 0-255
    rgb = rgb/255.0
    def inv_gamma(u):
        return np.where(u<=0.04045, u/12.92, ((u+0.055)/1.055)**2.4)
    rl = inv_gamma(rgb)
    M = np.array([[0.4124564,0.3575761,0.1804375],
                  [0.2126729,0.7151522,0.0721750],
                  [0.0193339,0.1191920,0.9503041]])
    xyz = rl @ M.T
    Xn,Yn,Zn = 0.95047,1.0,1.08883
    xyz_n = xyz / np.array([Xn,Yn,Zn])
    def f(t):
        d = 6/29
        return np.where(t>d**3, np.cbrt(t), t/(3*d*d)+4/29)
    fxyz = f(xyz_n)
    L = 116*fxyz[...,1]-16
    a = 500*(fxyz[...,0]-fxyz[...,1])
    b = 200*(fxyz[...,1]-fxyz[...,2])
    return np.stack([L,a,b], axis=-1)

def is_orange(rgb):
    r,g,b = rgb[...,0], rgb[...,1], rgb[...,2]
    return (r-b>25) & (r>150) & (g>90)

SIZE = 64
yy, xx = np.mgrid[0:SIZE, 0:SIZE]

def synth_sample(logt):
    tf = true_frac(logt)
    spot_rgb = true_spot_rgb(logt)
    bg_rgb = true_bg_rgb(logt)

    # batch/paper variation (independent of exposure)
    batch_shift = rng.normal(0, 10, size=3)
    bg_base = np.clip(bg_rgb + batch_shift, 0, 255)
    spot_base = np.clip(spot_rgb + batch_shift*0.6, 0, 255)

    img = np.tile(bg_base, (SIZE,SIZE,1)).astype(np.float64)

    # blob position: random offset from center
    cx = SIZE/2 + rng.normal(0, SIZE*0.08)
    cy = SIZE/2 + rng.normal(0, SIZE*0.08)
    area_px = tf * SIZE * SIZE
    radius = np.sqrt(max(area_px,1) / np.pi)
    # soft-edge gaussian blob: sigma tied to radius, some random softness
    sigma = radius * rng.uniform(0.55, 0.85) + 1e-3
    dist2 = (xx-cx)**2 + (yy-cy)**2
    blob = np.exp(-dist2/(2*sigma**2))
    blob = blob[...,None]  # (SIZE,SIZE,1)

    img = img*(1-blob) + spot_base*blob

    # photometric jitter: brightness, contrast, white balance, noise, occasional vignette
    brightness = rng.uniform(0.82, 1.18)
    contrast = rng.uniform(0.88, 1.12)
    wb = rng.uniform(0.92, 1.08, size=3)
    img = (img - 128)*contrast + 128
    img = img*brightness
    img = img*wb
    noise_sigma = rng.uniform(2, 9)
    img = img + rng.normal(0, noise_sigma, size=img.shape)

    if rng.random() < 0.35:
        # mild vignette / uneven lighting gradient
        grad_dir = rng.uniform(0, 2*np.pi)
        gx, gy = np.cos(grad_dir), np.sin(grad_dir)
        grad = (xx-SIZE/2)*gx + (yy-SIZE/2)*gy
        grad = grad/grad.std()
        strength = rng.uniform(-8, 8)
        img = img + (grad*strength)[...,None]

    img = np.clip(img, 0, 255)
    return img

def extract_features(img):
    mask = is_orange(img)
    frac = float(mask.mean())
    if mask.sum() > 3:
        orange_mean = img[mask].mean(axis=0)
    else:
        orange_mean = img.reshape(-1,3).mean(axis=0)
    if (~mask).sum() > 3:
        bg_mean = img[~mask].mean(axis=0)
    else:
        bg_mean = img.reshape(-1,3).mean(axis=0)
    lab_o = rgb_to_lab_batch(orange_mean)
    lab_b = rgb_to_lab_batch(bg_mean)
    deltaE = float(np.linalg.norm(lab_o - lab_b))
    return frac, deltaE

N = 4500
LOGT_MIN, LOGT_MAX = np.log10(8), np.log10(36000)  # slightly wider than 10s-8hr real range
logts = rng.uniform(LOGT_MIN, LOGT_MAX, size=N)

X = np.zeros((N,2))
y = np.zeros(N)
for idx, logt in enumerate(logts):
    img = synth_sample(logt)
    frac, de = extract_features(img)
    X[idx,0] = frac
    X[idx,1] = de
    y[idx] = logt

np.save('work/X.npy', X)
np.save('work/y.npy', y)
print('Generated', N, 'synthetic samples')
print('feature ranges: frac', X[:,0].min(), X[:,0].max(), '| deltaE', X[:,1].min(), X[:,1].max())
print('label range (logt):', y.min(), y.max())

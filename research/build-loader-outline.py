"""Deterministic SVG contour derivation; never writes or changes photo pixels."""
from pathlib import Path
import hashlib
import json
import cv2
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'assets/dea-original-cutout.png'
PHOTO = ROOT / 'assets/dea-portrait.jpg'
OUTPUT = ROOT / 'assets/dea-loader-outline.svg'
RECORD = ROOT / 'research/outline-provenance.json'
CROP = (462, 118, 3036, 3218)

def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

source_sha, photo_sha = sha(SOURCE), sha(PHOTO)
rgba = np.array(Image.open(SOURCE).convert('RGBA'))
photo_rgb = np.array(Image.open(PHOTO).convert('RGB').crop(CROP))
assert np.array_equal(rgba[:, :, :3], photo_rgb), 'Original RGB verification failed'
height, width = rgba.shape[:2]
assert (width, height) == (2574, 3100)

# Half-resolution tracing suppresses pixel noise while retaining the exact crop mapping.
trace_width, trace_height = width // 2, height // 2
rgb = cv2.resize(rgba[:, :, :3], (trace_width, trace_height), interpolation=cv2.INTER_AREA)
alpha = cv2.resize(rgba[:, :, 3], (trace_width, trace_height), interpolation=cv2.INTER_AREA)
scale_x, scale_y = width / trace_width, height / trace_height

def path_data(points, closed=False):
    if len(points) < 2:
        return None
    coords = [(round(float(p[0]) * scale_x, 1), round(float(p[1]) * scale_y, 1)) for p in points]
    def fmt(n):
        return str(int(n)) if n.is_integer() else str(n)
    return 'M' + ' L'.join(f'{fmt(x)} {fmt(y)}' for x, y in coords) + (' Z' if closed else '')

silhouette_paths = []
silhouette = (alpha >= 128).astype('uint8') * 255
contours, _ = cv2.findContours(silhouette, cv2.RETR_LIST, cv2.CHAIN_APPROX_NONE)
for contour in sorted(contours, key=lambda c: (-cv2.contourArea(c), cv2.boundingRect(c))):
    if cv2.contourArea(contour) < 45:
        continue
    points = cv2.approxPolyDP(contour, 1.15, True).reshape(-1, 2)
    border = (points[:, 1] >= trace_height - 2)
    if not border.any():
        silhouette_paths.append(path_data(points, True))
        continue
    # The source crop ends at the lap. Do not invent a horizontal anatomical boundary.
    split = int(np.flatnonzero(border)[0])
    points = np.concatenate((points[split:], points[:split]))
    segment = []
    for point in points:
        if point[1] >= trace_height - 2:
            if len(segment) > 1:
                silhouette_paths.append(path_data(np.array(segment)))
            segment = []
        else:
            segment.append(point)
    if len(segment) > 1:
        silhouette_paths.append(path_data(np.array(segment)))

# Trace only strong, clean photographic contours safely inside the foreground mask.
gray = cv2.cvtColor(rgb, cv2.COLOR_RGB2GRAY)
gray = cv2.bilateralFilter(gray, 7, 45, 6)
gray = cv2.GaussianBlur(gray, (5, 5), 1.1)
edges = cv2.Canny(gray, 35, 90)
interior = cv2.erode((alpha >= 245).astype('uint8'), np.ones((9, 9), np.uint8))
edges[interior == 0] = 0
contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
retained = [c for c in contours if cv2.arcLength(c, True) >= 40]
retained.sort(key=lambda c: (-cv2.arcLength(c, True), cv2.boundingRect(c)))
retained = retained[:120]
internal_paths = []
for contour in retained:
    points = cv2.approxPolyDP(contour, 1.0, True).reshape(-1, 2)
    if len(points) >= 3:
        internal_paths.append(path_data(points, True))

silhouette_paths = [p for p in silhouette_paths if p]
internal_paths = [p for p in internal_paths if p]
lines = [
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2574 3100" width="2574" height="3100" fill="none">',
    '  <title>Coach DÉA portrait contours</title>',
    '  <desc>White contours traced deterministically from the original photograph and its foreground alpha mask. No generated or redrawn facial features.</desc>',
    '  <g stroke="#ffffff" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" opacity="0.92">',
    *[f'    <path pathLength="1" d="{p}"/>' for p in silhouette_paths],
    '  </g>',
    '  <g stroke="#ffffff" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.42">',
    *[f'    <path pathLength="1" d="{p}"/>' for p in internal_paths],
    '  </g>',
    '</svg>',
]
OUTPUT.write_text('\n'.join(lines) + '\n')
assert sha(SOURCE) == source_sha and sha(PHOTO) == photo_sha
report = {
    'method': 'Non-generative deterministic alpha-silhouette and photographic-edge contour tracing',
    'source': str(SOURCE.relative_to(ROOT)),
    'source_sha256': source_sha,
    'original_photo': str(PHOTO.relative_to(ROOT)),
    'original_photo_sha256': photo_sha,
    'source_rgb_exactly_matches_original_crop': True,
    'original_crop_bounds': list(CROP),
    'viewBox': [0, 0, width, height],
    'trace_dimensions': [trace_width, trace_height],
    'silhouette': {'alpha_threshold': 128, 'minimum_contour_area_trace_pixels': 45, 'simplification_epsilon_trace_pixels': 1.15, 'path_count': len(silhouette_paths), 'photograph_bottom_crop_boundary_omitted': True},
    'internal_edges': {'grayscale': 'OpenCV RGB2GRAY', 'bilateral_filter': {'diameter': 7, 'sigma_color': 45, 'sigma_space': 6}, 'gaussian_blur': {'kernel': [5, 5], 'sigma': 1.1}, 'canny_thresholds': [35, 90], 'mask_minimum_alpha': 245, 'mask_erosion_kernel': [9, 9], 'minimum_contour_length_trace_pixels': 40, 'maximum_path_count': 120, 'simplification_epsilon_trace_pixels': 1.0, 'path_count': len(internal_paths)},
    'output': str(OUTPUT.relative_to(ROOT)),
    'output_sha256': sha(OUTPUT),
    'output_bytes': OUTPUT.stat().st_size,
    'total_path_count': len(silhouette_paths) + len(internal_paths),
    'all_paths_normalized_path_length': 1,
    'stroke_style': {'silhouette_width': 8, 'silhouette_opacity': 0.92, 'internal_width': 4.5, 'internal_opacity': 0.42},
    'embedded_rasters': 0,
    'generated_pixels': 0,
    'hand_drawn_paths': 0,
    'photographic_assets_unchanged': True,
    'versions': {'opencv': cv2.__version__, 'numpy': np.__version__},
}
RECORD.write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps(report, indent=2))

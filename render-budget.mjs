// Reduce only supersampling; never change output size or camera framing.
export function nextRenderScale(current, fps, target) {
 if (!Number.isFinite(fps) || fps <= 0 || fps >= target * .8) return current;
 return Math.max(1, Math.round(current * .75 * 100) / 100);
}

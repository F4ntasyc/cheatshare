// Siapkan foto sebelum diunggah: validasi tipe/ukuran, perkecil, buang EXIF.
const MAX_INPUT = 30 * 1024 * 1024;
const MAX_OUTPUT = 10 * 1024 * 1024;
const MAX_SIDE = 2000;
const PNG_KEEP = 1.5 * 1024 * 1024;
const JPEG_QUALITY = 0.9;

function kindOf(file) {
  if (file.type === 'image/jpeg') return 'jpeg';
  if (file.type === 'image/png') return 'png';
  if (!file.type) {
    const name = (file.name || '').toLowerCase();
    if (/\.(jpe?g)$/.test(name)) return 'jpeg';
    if (name.endsWith('.png')) return 'png';
  }
  return null;
}

async function decode(file) {
  try {
    // 'from-image' = terapkan orientasi EXIF sebelum digambar ulang.
    return await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    throw new Error('File bukan foto JPG/PNG yang valid');
  }
}

async function toJpeg(bitmap) {
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff'; // latar putih untuk PNG transparan
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close?.();
  const blob = await new Promise((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY),
  );
  if (!blob) throw new Error('Foto gagal diproses');
  return blob;
}

export async function prepareImage(file) {
  const kind = kindOf(file);
  if (!kind) throw new Error('Format foto harus JPG atau PNG');
  if (file.size > MAX_INPUT) throw new Error('File terlalu besar (maks. 30 MB)');
  const bitmap = await decode(file);
  let out;
  if (
    kind === 'png' &&
    file.size <= PNG_KEEP &&
    Math.max(bitmap.width, bitmap.height) <= MAX_SIDE
  ) {
    bitmap.close?.();
    out = file.type ? file : new Blob([file], { type: 'image/png' });
  } else {
    // JPEG selalu di-encode ulang (sekaligus membuang EXIF/GPS).
    out = await toJpeg(bitmap);
  }
  if (out.size > MAX_OUTPUT) throw new Error('Foto terlalu besar (maks. 10 MB)');
  return out;
}

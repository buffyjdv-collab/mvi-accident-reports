// Client-side image helper: read a File, downscale to a max dimension,
// and return a compressed JPEG as a base64 data URL.
// This keeps DB storage small (typically 50-300KB per photo).

const MAX_DIMENSION = 1280; // px — longest side
const JPEG_QUALITY = 0.8; // 0-1
const MAX_RAW_BYTES = 8 * 1024 * 1024; // 8MB — reject files larger than this

/**
 * Read an image File, downscale it so the longest side <= MAX_DIMENSION,
 * compress to JPEG, and return a base64 data URL.
 */
export async function fileToCompressedDataUrl(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Please select an image file (PNG, JPG, etc.)');
  }
  if (file.size > MAX_RAW_BYTES) {
    throw new Error('Image is too large (max 8MB). Please choose a smaller image.');
  }

  const dataUrl = await readFileAsDataUrl(file);
  const img = await loadImage(dataUrl);

  let width = img.naturalWidth;
  let height = img.naturalHeight;

  if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
    if (width >= height) {
      height = Math.round((height * MAX_DIMENSION) / width);
      width = MAX_DIMENSION;
    } else {
      width = Math.round((width * MAX_DIMENSION) / height);
      height = MAX_DIMENSION;
    }
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not get canvas context for image compression');
  }
  ctx.drawImage(img, 0, 0, width, height);
  return canvas.toDataURL('image/jpeg', JPEG_QUALITY);
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Could not read the selected file'));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not load the selected image'));
    img.src = src;
  });
}

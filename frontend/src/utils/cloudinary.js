// Inserts Cloudinary transformation params into an existing delivery URL.
// Only touches real Cloudinary URLs — anything else passes through unchanged.
export function optimizeCloudinaryUrl(url, { width, height } = {}) {
  if (typeof url !== "string" || !url.includes("res.cloudinary.com")) {
    return url;
  }

  const w = width || 400;
  const h = height || width || 400;
  const transform = `f_auto,q_auto,w_${w},h_${h},c_fill,g_auto`;

  return url.replace("/upload/", `/upload/${transform}/`);
}
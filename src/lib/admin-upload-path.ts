const UPLOAD_PATH = /^\/uploads\/(products|categories)\/[a-z0-9._-]+$/i;

export function isValidUploadPath(imagePath: string, subdir: "products" | "categories") {
  return UPLOAD_PATH.test(imagePath) && imagePath.startsWith(`/uploads/${subdir}/`);
}

export function assertValidUploadPath(imagePath: string, subdir: "products" | "categories") {
  if (!isValidUploadPath(imagePath, subdir)) {
    throw new Error("Invalid image path");
  }
}

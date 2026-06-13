const UPLOAD_PATH = /^\/uploads\/(products|categories|services)\/[a-z0-9._-]+$/i;

export function isValidUploadPath(imagePath: string, subdir: "products" | "categories" | "services") {
  return UPLOAD_PATH.test(imagePath) && imagePath.startsWith(`/uploads/${subdir}/`);
}

export function assertValidUploadPath(imagePath: string, subdir: "products" | "categories" | "services") {
  if (!isValidUploadPath(imagePath, subdir)) {
    throw new Error("Invalid image path");
  }
}

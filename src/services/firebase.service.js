import admin from "firebase-admin";
import { v4 as uuidv4 } from "uuid";
import sharp from "sharp";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const require = createRequire(import.meta.url);
const serviceAccount = require(path.join(
  __dirname,
  "../config/firebase/serviceAccountKey.json"
));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "shop-a080e.appspot.com",
});

const bucket = admin.storage().bucket();

// Upload image function
export const uploadImageToFirebase = async (
  fileBuffer,
  fileName,
  compress = false
) => {
  try {
    let bufferToUpload = fileBuffer;

    if (compress) {
      bufferToUpload = await sharp(fileBuffer)
        .resize({ width: 800 })
        .jpeg({ quality: 80 })
        .toBuffer();
    }

    const remoteFileName = `images/${uuidv4()}-${fileName}`;
    const file = bucket.file(remoteFileName);

    const stream = file.createWriteStream({
      metadata: {
        contentType: "image/jpeg",
        firebaseStorageDownloadTokens: uuidv4(),
      },
    });

    return new Promise((resolve, reject) => {
      stream.on("error", (error) => {
        console.error("Error uploading image:", error);
        reject(error);
      });

      stream.on("finish", () => {
        const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${
          bucket.name
        }/o/${encodeURIComponent(remoteFileName)}?alt=media`;
        console.log("Uploaded image URL:", imageUrl);
        resolve(imageUrl);
      });

      stream.end(bufferToUpload);
    });
  } catch (error) {
    console.error("Error during image upload:", error);
    throw error;
  }
};

export const uploadFileToFirebase = async (
  fileBuffer,
  fileName,
  contentType
) => {
  try {
    const remoteFileName = `cv/${uuidv4()}-${fileName}`;
    const file = bucket.file(remoteFileName);

    const stream = file.createWriteStream({
      metadata: {
        contentType: contentType,
        firebaseStorageDownloadTokens: uuidv4(),
      },
    });

    return new Promise((resolve, reject) => {
      stream.on("error", (error) => {
        console.error("Error uploading file:", error);
        reject(error);
      });

      stream.on("finish", () => {
        const fileUrl = `https://firebasestorage.googleapis.com/v0/b/${
          bucket.name
        }/o/${encodeURIComponent(remoteFileName)}?alt=media`;
        console.log("Uploaded file URL:", fileUrl);
        resolve(fileUrl);
      });

      stream.end(fileBuffer);
    });
  } catch (error) {
    console.error("Error during file upload:", error);
    throw error;
  }
};

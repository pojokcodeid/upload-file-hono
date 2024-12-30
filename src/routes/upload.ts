import { Hono } from "hono";
import { existsSync, createWriteStream, unlinkSync } from "fs";
import { mkdir } from "fs/promises";
import path from "path";
import { createHash } from "crypto";

const uploadDir = path.join(process.cwd(), "public/img");
if (!existsSync(uploadDir)) {
  mkdir(uploadDir, { recursive: true });
}

export const uploadRoute = new Hono();

uploadRoute.post("/", async (c) => {
  const body = await c.req.parseBody();
  const files = body.photo;

  if (!files || (Array.isArray(files) && files.length === 0)) {
    return c.json({ message: "No files uploaded" }, 400);
  }

  const fileArray = Array.isArray(files) ? files : [files];

  const processImage = await Promise.all(
    fileArray.map(async (file) => {
      const buffer = Buffer.from(await file.arrayBuffer());
      return {
        name: file.name,
        type: file.type,
        size: file.size,
        buffer,
      };
    })
  );

  let fileName = "";
  processImage.forEach((image) => {
    const hash = createHash("md5").update(image.name).digest("hex");
    const ext = path.extname(image.name);
    fileName = `${hash}${ext}`;
    if (existsSync(path.join(uploadDir, fileName))) {
      unlinkSync(path.join(uploadDir, fileName));
    }
    const filePath = path.join(uploadDir, fileName);
    const fileStream = createWriteStream(filePath);
    fileStream.write(image.buffer);
    fileStream.end();
  });
  const url = new URL(c.req.url);
  const protocol = url.protocol;
  const host = c.req.header("host");
  let fullurl = `${protocol}//${host}/public/img/${fileName}`;
  // tempat untuk simpan ke database jika diperlukan
  return c.json(
    {
      message: "hello Hono form image route",
      files: {
        name: fullurl,
        type: processImage[0].type,
        size: processImage[0].size,
      },
    },
    200
  );
});

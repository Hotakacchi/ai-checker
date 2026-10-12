// 拡張機能のアイコン（虫めがね＋AIのきらめき）を SVG から PNG に書き出す
import sharp from "sharp";
import { fileURLToPath } from "node:url";

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
  <rect width="128" height="128" rx="28" fill="#4f46e5"/>
  <circle cx="56" cy="56" r="30" fill="none" stroke="#fff" stroke-width="11"/>
  <path d="M78 78 L104 104" stroke="#fff" stroke-width="14" stroke-linecap="round"/>
  <path d="M56 38 C58 50 62 54 74 56 C62 58 58 62 56 74 C54 62 50 58 38 56 C50 54 54 50 56 38 Z" fill="#fff"/>
</svg>`;

const dir = fileURLToPath(new URL("../icons/", import.meta.url));
for (const size of [16, 32, 48, 128]) {
  await sharp(Buffer.from(svg)).resize(size, size).png().toFile(`${dir}icon${size}.png`);
}
console.log("icons written");

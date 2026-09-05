/**
 * Xuất một khối DOM thành ảnh PNG, không dùng thư viện ngoài.
 *
 * Cách làm: nhân bản node → nhét vào `<foreignObject>` của một SVG → nạp SVG
 * qua data URI vào `<img>` → vẽ lên canvas → `toDataURL`.
 *
 * Điều kiện bắt buộc: node phải **tự mang toàn bộ style inline**. Trình duyệt
 * không kéo theo stylesheet ngoài vào foreignObject, và các thư viện làm việc
 * này (html-to-image, html2canvas) phải quét `document.styleSheets` để bù —
 * với stylesheet Tailwind cỡ lớn thì bước quét đó treo. Bản in tự mang style
 * nên bỏ hẳn được bước đó.
 */
export async function nodeToPngDataUrl(
  node: HTMLElement,
  scale = 2,
): Promise<string> {
  const width = node.offsetWidth;
  const height = node.offsetHeight;
  if (!width || !height) throw new Error("Khối cần xuất chưa có kích thước");

  const clone = node.cloneNode(true) as HTMLElement;
  clone.setAttribute("xmlns", "http://www.w3.org/1999/xhtml");

  const xml = new XMLSerializer().serializeToString(clone);
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">` +
    `<foreignObject x="0" y="0" width="100%" height="100%">${xml}</foreignObject>` +
    `</svg>`;

  const img = await loadImage(
    `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`,
  );

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Trình duyệt không hỗ trợ canvas 2D");

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  return canvas.toDataURL("image/png");
}

function loadImage(src: string, timeoutMs = 15_000): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const timer = setTimeout(
      () => reject(new Error("Quá hạn nạp ảnh")),
      timeoutMs,
    );
    img.onload = () => {
      clearTimeout(timer);
      resolve(img);
    };
    img.onerror = () => {
      clearTimeout(timer);
      reject(new Error("Không nạp được ảnh"));
    };
    img.src = src;
  });
}

/** Tải data URL về máy dưới dạng file. */
export function downloadDataUrl(dataUrl: string, fileName: string) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

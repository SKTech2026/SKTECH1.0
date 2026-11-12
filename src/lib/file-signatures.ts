const OLE_HEADER = Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);
const PNG_HEADER = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

export function hasFileSignature(bytes: Buffer, mimeType: string): boolean {
  if (mimeType === "image/jpeg") {
    return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }
  if (mimeType === "image/png") return bytes.subarray(0, 8).equals(PNG_HEADER);
  if (mimeType === "image/webp") {
    return bytes.length >= 12 && bytes.toString("ascii", 0, 4) === "RIFF" &&
      bytes.toString("ascii", 8, 12) === "WEBP";
  }
  if (mimeType === "application/pdf") return bytes.subarray(0, 5).toString("ascii") === "%PDF-";
  return false;
}

// Container identification only: CFB and ZIP headers cannot prove a particular Office document type.
export function hasOfficeContainerSignature(bytes: Buffer, extension: string): boolean {
  if (["doc", "xls", "ppt"].includes(extension)) {
    return bytes.subarray(0, 8).equals(OLE_HEADER);
  }
  if (["docx", "xlsx", "pptx"].includes(extension)) {
    return bytes.length >= 4 && bytes[0] === 0x50 && bytes[1] === 0x4b &&
      bytes[2] === 0x03 && bytes[3] === 0x04;
  }
  return false;
}

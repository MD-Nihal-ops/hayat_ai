export function cleanPhone(raw) {
  let phone = String(raw ?? "").replace(/[\s\-()[\]]/g, "");
  phone = phone.replace(/^(?:\+|00)/, "");
  return phone.replace(/\D/g, "");
}

export function isValidPhone(raw) {
  return /^\d{8,15}$/.test(cleanPhone(raw));
}

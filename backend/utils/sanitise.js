const stripHtml = (str = "") => str.replace(/<[^>]*>/g, "").trim();

const sanitiseRichText = (html = "") =>
  html
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "")
    .replace(/<link[^>]*>/gi, "")
    .replace(/\son\w+\s*=\s*["'][^"']*["']/gi, "")
    .replace(/\son\w+\s*=\s*[^\s>]*/gi, "")
    .replace(/javascript\s*:/gi, "")
    .replace(/vbscript\s*:/gi, "")
    .replace(/data\s*:/gi, "")
    .trim();

const escapeHtml = (str = "") =>
  str.replace(/&/g,"&amp;").replace(/"/g,"&quot;")
     .replace(/'/g,"&#x27;").replace(/</g,"&lt;").replace(/>/g,"&gt;");

module.exports = { stripHtml, sanitiseRichText, escapeHtml };
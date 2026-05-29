// /**
//  * Sanitisation utilities — strips dangerous HTML from rich-text content.
//  * Uses a whitelist approach: only safe tags and attributes are kept.
//  */

// // Allowed tags for article rich text (Quill / HTML body)
// const ALLOWED_TAGS = [
//   "p", "br", "b", "i", "u", "strong", "em", "s", "blockquote",
//   "h1", "h2", "h3", "h4", "h5", "h6",
//   "ul", "ol", "li",
//   "a", "img", "figure", "figcaption",
//   "table", "thead", "tbody", "tr", "th", "td",
//   "pre", "code", "span", "div",
//   "iframe",       // only for embedded YouTube – src is validated separately
//   "video", "source",
// ];

// const ALLOWED_ATTRS = {
//   a: ["href", "title", "target", "rel"],
//   img: ["src", "alt", "width", "height", "loading"],
//   iframe: ["src", "width", "height", "frameborder", "allowfullscreen", "title"],
//   video: ["src", "controls", "width", "height", "poster"],
//   source: ["src", "type"],
//   "*": ["class", "id", "style"],
// };

// // Only allow https:// and ImageKit URLs in img src
// const ALLOWED_IMG_DOMAINS = [
//   /^https:\/\/ik\.imagekit\.io\//,
//   /^https:\/\//,
// ];

// /**
//  * Sanitise a plain text string — strips all HTML
//  */
// const stripHtml = (str = "") => str.replace(/<[^>]*>/g, "").trim();

// /**
//  * Sanitise a rich-text HTML string.
//  * In production this should use DOMPurify (server-side via jsdom) or
//  * the `sanitize-html` npm package. This function is a placeholder that
//  * uses regex-level stripping for the most dangerous vectors.
//  *
//  * Recommended: npm install sanitize-html  and replace body below.
//  */
// const sanitiseRichText = (html = "") => {
//   // Remove <script>, <style>, <link>, on* event handlers, javascript: URLs
//   return html
//     .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
//     .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "")
//     .replace(/<link[^>]*>/gi, "")
//     .replace(/\son\w+\s*=\s*["'][^"']*["']/gi, "")   // onclick="..." etc.
//     .replace(/\son\w+\s*=\s*[^\s>]*/gi, "")           // onclick=... (no quotes)
//     .replace(/javascript\s*:/gi, "")
//     .replace(/vbscript\s*:/gi, "")
//     .replace(/data\s*:/gi, "")
//     .trim();
// };

// /**
//  * Escape a string for safe inclusion in HTML attribute values
//  */
// const escapeHtmlAttr = (str = "") =>
//   str
//     .replace(/&/g, "&amp;")
//     .replace(/"/g, "&quot;")
//     .replace(/'/g, "&#x27;")
//     .replace(/</g, "&lt;")
//     .replace(/>/g, "&gt;");

// module.exports = { stripHtml, sanitiseRichText, escapeHtmlAttr, ALLOWED_TAGS, ALLOWED_ATTRS };



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
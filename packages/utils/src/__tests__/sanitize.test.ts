// @vitest-environment node
//
// Isomorphic-dompurify uses jsdom in Node, but happy-dom's partial DOM
// implementation confuses its runtime detection and some FORBID_TAGS
// entries silently fail to apply. Run sanitize tests in pure Node so
// the same jsdom instance we ship with in production is what gets
// validated.
import { describe, it, expect } from "vitest";
import { sanitizeHtml } from "../sanitize";

describe("sanitizeHtml", () => {
  it("returns empty string for empty input", () => {
    expect(sanitizeHtml("")).toBe("");
  });

  it("preserves safe text", () => {
    expect(sanitizeHtml("Hello <b>world</b>")).toContain("<b>world</b>");
  });

  it("strips <script> tags entirely", () => {
    const out = sanitizeHtml("<p>ok</p><script>alert('xss')</script>");
    expect(out).not.toMatch(/<\s*\/?\s*script/i);
    expect(out).toContain("ok");
  });

  it("strips inline event handlers", () => {
    const out = sanitizeHtml(`<img src="x" onerror="alert(1)">`);
    expect(out).not.toMatch(/onerror/i);
    expect(out).not.toContain("alert");
  });

  it("strips javascript: URLs in href", () => {
    const out = sanitizeHtml(`<a href="javascript:alert(1)">click</a>`);
    expect(out).not.toMatch(/javascript:/i);
  });

  it("strips data: URIs that target text/html", () => {
    const out = sanitizeHtml(`<a href="data:text/html,<script>alert(1)</script>">x</a>`);
    expect(out).not.toMatch(/data:text\/html/i);
  });

  it("removes <iframe> entirely", () => {
    const out = sanitizeHtml(`<p>safe</p><iframe src="https://evil.example"></iframe>`);
    expect(out).not.toMatch(/<\s*\/?\s*iframe/i);
  });

  it("removes <object> / <embed> / <applet>", () => {
    const out = sanitizeHtml(
      `<object data="x"></object><embed src="x"><applet code="x"></applet>`,
    );
    expect(out).not.toMatch(/<\s*\/?\s*object/i);
    expect(out).not.toMatch(/<\s*\/?\s*embed/i);
    expect(out).not.toMatch(/<\s*\/?\s*applet/i);
  });

  it("strips inline <style> blocks", () => {
    const out = sanitizeHtml(`<style>body{background:url('javascript:1')}</style><p>x</p>`);
    expect(out).not.toMatch(/<\s*\/?\s*style/i);
  });

  it("strips `style=` attributes", () => {
    const out = sanitizeHtml(`<p style="background:url('javascript:1')">x</p>`);
    expect(out).not.toMatch(/style=/i);
  });

  it("strips <meta http-equiv='refresh'>", () => {
    const out = sanitizeHtml(`<meta http-equiv="refresh" content="0;url=//evil">`);
    expect(out).not.toMatch(/<\s*\/?\s*meta/i);
  });

  it("keeps safe anchors and preserves href", () => {
    const out = sanitizeHtml(`<a href="https://example.com">example</a>`);
    expect(out).toContain('href="https://example.com"');
    expect(out).toContain("example");
  });

  it("hardens target=\"_blank\" links with rel=noopener noreferrer", () => {
    const out = sanitizeHtml(`<a href="https://example.com" target="_blank">x</a>`);
    expect(out).toContain("noopener");
    expect(out).toContain("noreferrer");
  });

  it("preserves common inline formatting", () => {
    const out = sanitizeHtml(
      "<p><strong>bold</strong> <em>italic</em> <code>code</code></p>",
    );
    expect(out).toContain("<strong>bold</strong>");
    expect(out).toContain("<em>italic</em>");
    expect(out).toContain("<code>code</code>");
  });

  it("preserves lists and tables", () => {
    const out = sanitizeHtml(
      "<ul><li>a</li></ul><table><thead><tr><th>h</th></tr></thead><tbody><tr><td>d</td></tr></tbody></table>",
    );
    expect(out).toContain("<li>a</li>");
    expect(out).toContain("<th>h</th>");
    expect(out).toContain("<td>d</td>");
  });

  it("strips data-* attributes", () => {
    const out = sanitizeHtml(`<p data-evil="payload">x</p>`);
    expect(out).not.toMatch(/data-evil/i);
  });

  it("blocks clobbering-style form/input injection", () => {
    const out = sanitizeHtml(
      `<form action="//evil"><input name="method" value="GET"></form>`,
    );
    expect(out).not.toMatch(/<form/i);
    expect(out).not.toMatch(/<input/i);
  });
});

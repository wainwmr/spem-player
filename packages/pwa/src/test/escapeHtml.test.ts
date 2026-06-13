import { describe, it, expect } from "vitest";
import { escapeHtml } from "../ts/escapeHtml";

describe("escapeHtml", () => {
  it("escapes ampersand", () => {
    expect(escapeHtml("a & b")).toBe("a &amp; b");
  });

  it("escapes less-than", () => {
    expect(escapeHtml("a < b")).toBe("a &lt; b");
  });

  it("escapes greater-than", () => {
    expect(escapeHtml("a > b")).toBe("a &gt; b");
  });

  it("escapes double quote", () => {
    expect(escapeHtml('say "hello"')).toBe("say &quot;hello&quot;");
  });

  it("escapes single quote", () => {
    expect(escapeHtml("it's")).toBe("it&#39;s");
  });

  it("escapes all dangerous characters together", () => {
    expect(escapeHtml("test\"<>&'")).toBe("test&quot;&lt;&gt;&amp;&#39;");
  });

  it("prevents script injection in HTML context", () => {
    const malicious = "<script>alert(1)</script>";
    const escaped = escapeHtml(malicious);
    expect(escaped).toBe("&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(escaped).not.toContain("<script>");
  });

  it("prevents attribute breakout in double-quoted attribute", () => {
    const branch = 'xss"><script>alert(1)</script>';
    const escaped = escapeHtml(branch);
    const attr = `data-branch="${escaped}"`;
    expect(attr).toBe(
      'data-branch="xss&quot;&gt;&lt;script&gt;alert(1)&lt;/script&gt;"'
    );
  });

  it("leaves safe text unchanged", () => {
    expect(escapeHtml("Spem Player v2.5.5")).toBe("Spem Player v2.5.5");
  });
});

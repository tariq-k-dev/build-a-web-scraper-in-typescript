import { describe, it, expect } from "vitest";

import {
    normalizeURL,
    getH1FromHTML,
    getFirstParagraphFromHTML,
} from "./crawl";

describe("normalizeURL", () => {
    it("removes hash fragments", () => {
        const input = "https://example.com/path#section";
        expect(normalizeURL(input)).toBe("https://example.com/path");
    });

    it("keeps query strings", () => {
        const input = "https://example.com/path?search=test#frag";
        expect(normalizeURL(input)).toBe(
            "https://example.com/path?search=test",
        );
    });

    it("removes hash when only fragment is present", () => {
        const input = "https://example.com#frag";
        expect(normalizeURL(input)).toBe("https://example.com/");
    });

    it("removes empty hash", () => {
        const input = "https://example.com/path#";
        expect(normalizeURL(input)).toBe("https://example.com/path");
    });

    it("normalizes root URLs with trailing slash", () => {
        const input = "https://example.com";
        expect(normalizeURL(input)).toBe("https://example.com/");
    });

    it("preserves path and trailing slash", () => {
        const input = "https://example.com/a/b/";
        expect(normalizeURL(input)).toBe("https://example.com/a/b/");
    });

    it("preserves port", () => {
        const input = "https://example.com:8080/path#frag";
        expect(normalizeURL(input)).toBe("https://example.com:8080/path");
    });

    it("preserves query order and encoding", () => {
        const input = "https://example.com/path?b=2&a=hello%20world#frag";
        expect(normalizeURL(input)).toBe(
            "https://example.com/path?b=2&a=hello%20world",
        );
    });

    it("throws for invalid URLs", () => {
        expect(() => normalizeURL("not-a-url")).toThrow("Invalid URL");
    });

    it("throws for relative URLs", () => {
        expect(() => normalizeURL("/relative/path#frag")).toThrow(
            "Invalid URL",
        );
    });

    it("throws for empty string", () => {
        expect(() => normalizeURL("")).toThrow("Invalid URL");
    });
});

describe("getH1FromHTML", () => {
    it("returns the text content of the first h1", () => {
        const html = "<html><body><h1>Hello World</h1></body></html>";
        expect(getH1FromHTML(html)).toBe("Hello World");
    });

    it("returns an empty string when no h1 exists", () => {
        const html = "<html><body><p>No heading</p></body></html>";
        expect(getH1FromHTML(html)).toBe("");
    });

    it("returns the first h1 when multiple exist", () => {
        const html = "<html><body><h1>First</h1><h1>Second</h1></body></html>";
        expect(getH1FromHTML(html)).toBe("First");
    });

    it("trims whitespace in h1 text", () => {
        const html = "<html><body><h1>  Trim Me  </h1></body></html>";
        expect(getH1FromHTML(html)).toBe("Trim Me");
    });
});

describe("getFirstParagraphFromHTML", () => {
    it("returns the text content of the first p", () => {
        const html =
            "<html><body><p>First paragraph.</p><p>Second paragraph.</p></body></html>";
        expect(getFirstParagraphFromHTML(html)).toBe("First paragraph.");
    });

    it("prioritizes the first p inside main", () => {
        const html = `
            <html><body>
                <p>Outside paragraph.</p>
                <main>
                    <p>Main paragraph.</p>
                </main>
            </body></html>
        `;
        expect(getFirstParagraphFromHTML(html)).toBe("Main paragraph.");
    });

    it("falls back to the first p if main has no p", () => {
        const html = `
            <html><body>
                <p>Outside paragraph.</p>
                <main>
                    <div>No paragraph here</div>
                </main>
            </body></html>
        `;
        expect(getFirstParagraphFromHTML(html)).toBe("Outside paragraph.");
    });

    it("returns an empty string when no p exists", () => {
        const html = "<html><body><div>No paragraph</div></body></html>";
        expect(getFirstParagraphFromHTML(html)).toBe("");
    });
});

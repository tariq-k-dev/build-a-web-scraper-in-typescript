import { describe, it, expect } from "vitest";

import {
    normalizeURL,
    getH1FromHTML,
    getFirstParagraphFromHTML,
    getURLsFromHTML,
    getImagesFromHTML,
    extractPageData,
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

describe("getURLsFromHTML", () => {
    it("returns absolute URLs", () => {
        const inputURL = "https://blog.boot.dev";
        const inputBody =
            '<html><body><a href="https://blog.boot.dev"><span>Boot.dev</span></a></body></html>';
        const actual = getURLsFromHTML(inputBody, inputURL);
        expect(actual).toEqual(["https://blog.boot.dev/"]);
    });

    it("converts relative URLs to absolute", () => {
        const inputURL = "https://blog.boot.dev";
        const inputBody =
            '<html><body><a href="/path"><span>Relative</span></a></body></html>';
        const actual = getURLsFromHTML(inputBody, inputURL);
        expect(actual).toEqual(["https://blog.boot.dev/path"]);
    });

    it("finds all anchor tags and ignores missing hrefs", () => {
        const inputURL = "https://blog.boot.dev";
        const inputBody = `
            <html><body>
                <a href="/one">One</a>
                <a>Missing</a>
                <a href="https://example.com/two">Two</a>
            </body></html>
        `;
        const actual = getURLsFromHTML(inputBody, inputURL);
        expect(actual).toEqual([
            "https://blog.boot.dev/one",
            "https://example.com/two",
        ]);
    });
});

describe("getImagesFromHTML", () => {
    it("converts relative image URLs to absolute", () => {
        const inputURL = "https://blog.boot.dev";
        const inputBody =
            '<html><body><img src="/logo.png" alt="Logo"></body></html>';
        const actual = getImagesFromHTML(inputBody, inputURL);
        expect(actual).toEqual(["https://blog.boot.dev/logo.png"]);
    });

    it("returns absolute image URLs as-is", () => {
        const inputURL = "https://blog.boot.dev";
        const inputBody =
            '<html><body><img src="https://cdn.example.com/logo.png" /></body></html>';
        const actual = getImagesFromHTML(inputBody, inputURL);
        expect(actual).toEqual(["https://cdn.example.com/logo.png"]);
    });

    it("ignores images without src attributes", () => {
        const inputURL = "https://blog.boot.dev";
        const inputBody = `
            <html><body>
                <img alt="Missing" />
                <img src="/one.png" />
            </body></html>
        `;
        const actual = getImagesFromHTML(inputBody, inputURL);
        expect(actual).toEqual(["https://blog.boot.dev/one.png"]);
    });
});

describe("extractPageData", () => {
    it("extractPageData basic", () => {
        const inputURL = "https://blog.boot.dev";
        const inputBody = `
            <html><body>
                <h1>Test Title</h1>
                <p>This is the first paragraph.</p>
                <a href="/link1">Link 1</a>
                <img src="/image1.jpg" alt="Image 1">
            </body></html>
        `;

        const actual = extractPageData(inputBody, inputURL);
        const expected = {
            url: "https://blog.boot.dev",
            h1: "Test Title",
            first_paragraph: "This is the first paragraph.",
            outgoing_links: ["https://blog.boot.dev/link1"],
            image_urls: ["https://blog.boot.dev/image1.jpg"],
        };

        expect(actual).toEqual(expected);
    });

    it("handles missing content gracefully", () => {
        const inputURL = "https://example.com";
        const inputBody = "<html><body><div>No content</div></body></html>";

        const actual = extractPageData(inputBody, inputURL);
        const expected = {
            url: "https://example.com",
            h1: "",
            first_paragraph: "",
            outgoing_links: [],
            image_urls: [],
        };

        expect(actual).toEqual(expected);
    });

    it("uses main paragraph and converts relative URLs", () => {
        const inputURL = "https://blog.boot.dev";
        const inputBody = `
            <html><body>
                <p>Outside paragraph.</p>
                <main>
                    <p>Main paragraph.</p>
                </main>
                <a href="/one">One</a>
                <a href="https://example.com/two">Two</a>
                <img src="/logo.png" />
                <img src="https://cdn.example.com/banner.png" />
            </body></html>
        `;

        const actual = extractPageData(inputBody, inputURL);
        const expected = {
            url: "https://blog.boot.dev",
            h1: "",
            first_paragraph: "Main paragraph.",
            outgoing_links: [
                "https://blog.boot.dev/one",
                "https://example.com/two",
            ],
            image_urls: [
                "https://blog.boot.dev/logo.png",
                "https://cdn.example.com/banner.png",
            ],
        };

        expect(actual).toEqual(expected);
    });
});

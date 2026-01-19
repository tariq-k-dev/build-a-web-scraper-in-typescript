import { describe, it, expect } from "vitest";

import { normalizeURL } from "./crawl";

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

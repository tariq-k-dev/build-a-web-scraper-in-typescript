import { JSDOM } from "jsdom";

function normalizeURL(url: string): string {
    try {
        const normalized = new URL(url);
        normalized.hash = "";
        return normalized.toString();
    } catch (e) {
        throw new Error(`Invalid URL: ${url}`);
    }
}

function getH1FromHTML(html: string): string {
    const dom = new JSDOM(html);
    const heading = dom.window.document.querySelector("h1");
    return heading?.textContent?.trim() ?? "";
}

function getFirstParagraphFromHTML(html: string): string {
    const dom = new JSDOM(html);
    const document = dom.window.document;
    const main = document.querySelector("main");
    const paragraph = main?.querySelector("p") ?? document.querySelector("p");
    return paragraph?.textContent?.trim() ?? "";
}

export { normalizeURL, getH1FromHTML, getFirstParagraphFromHTML };

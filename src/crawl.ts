import { JSDOM } from "jsdom";

type ExtractedPageData = {
    url: string;
    h1: string;
    first_paragraph: string;
    outgoing_links: string[];
    image_urls: string[];
};

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

function getURLsFromHTML(html: string, baseURL: string): string[] {
    const dom = new JSDOM(html);
    const links = Array.from(dom.window.document.querySelectorAll("a"));
    return links
        .map((link) => link.getAttribute("href"))
        .filter((href): href is string => Boolean(href))
        .map((href) => new URL(href, baseURL).toString());
}

function getImagesFromHTML(html: string, baseURL: string): string[] {
    const dom = new JSDOM(html);
    const images = Array.from(dom.window.document.querySelectorAll("img"));
    return images
        .map((image) => image.getAttribute("src"))
        .filter((src): src is string => Boolean(src))
        .map((src) => new URL(src, baseURL).toString());
}

function extractPageData(html: string, pageURL: string): ExtractedPageData {
    return {
        url: pageURL,
        h1: getH1FromHTML(html),
        first_paragraph: getFirstParagraphFromHTML(html),
        outgoing_links: getURLsFromHTML(html, pageURL),
        image_urls: getImagesFromHTML(html, pageURL),
    };
}

async function getHTML(url: string): Promise<void> {
    try {
        const response = await fetch(url, {
            headers: {
                "User-Agent": "BootCrawler/1.0",
            },
        });

        if (response.status >= 400) {
            console.error(
                `Error: received status code ${response.status} for ${url}`,
            );
            return;
        }

        const contentType = response.headers.get("content-type") ?? "";
        if (!contentType.toLowerCase().includes("text/html")) {
            console.error(
                `Error: expected text/html content type for ${url}, got ${contentType}`,
            );
            return;
        }

        const body = await response.text();
        console.log(body);
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`Error: failed to fetch ${url}: ${message}`);
    }
}

export {
    normalizeURL,
    getH1FromHTML,
    getFirstParagraphFromHTML,
    getURLsFromHTML,
    getImagesFromHTML,
    extractPageData,
    getHTML,
    type ExtractedPageData,
};

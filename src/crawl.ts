import { JSDOM } from "jsdom";
import pLimit from "p-limit";

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

class ConcurrentCrawler {
    private baseURL: string;
    private pages: Record<string, number>;
    private limit: <T>(fn: () => Promise<T>) => Promise<T>;
    private maxPages: number;
    private shouldStop: boolean;
    private allTasks: Set<Promise<void>>;
    private abortController: AbortController;

    constructor(
        baseURL: string,
        maxConcurrency: number = 5,
        maxPages: number = 100,
    ) {
        this.baseURL = baseURL;
        this.pages = {};
        this.limit = pLimit(maxConcurrency);
        this.maxPages = maxPages;
        this.shouldStop = false;
        this.allTasks = new Set();
        this.abortController = new AbortController();
    }

    private addPageVisit(normalizedURL: string): boolean {
        if (this.shouldStop) {
            return false;
        }

        if (Object.keys(this.pages).length >= this.maxPages) {
            this.shouldStop = true;
            console.log("Reached maximum number of pages to crawl.");
            this.abortController.abort();
            return false;
        }

        if (this.pages[normalizedURL]) {
            this.pages[normalizedURL] += 1;
            return false;
        }

        this.pages[normalizedURL] = 1;
        return true;
    }

    private async getHTML(currentURL: string): Promise<string> {
        return await this.limit(async () => {
            try {
                const response = await fetch(currentURL, {
                    headers: {
                        "User-Agent": "BootCrawler/1.0",
                    },
                    signal: this.abortController.signal,
                });

                if (response.status >= 400) {
                    console.error(
                        `Error: received status code ${response.status} for ${currentURL}`,
                    );
                    return "";
                }

                const contentType = response.headers.get("content-type") ?? "";
                if (!contentType.toLowerCase().includes("text/html")) {
                    console.error(
                        `Error: expected text/html content type for ${currentURL}, got ${contentType}`,
                    );
                    return "";
                }

                const body = await response.text();
                console.log(body);
                return body;
            } catch (error) {
                if (error instanceof Error && error.name === "AbortError") {
                    return "";
                }
                const message =
                    error instanceof Error ? error.message : String(error);
                console.error(
                    `Error: failed to fetch ${currentURL}: ${message}`,
                );
                return "";
            }
        });
    }

    private async crawlPage(currentURL: string): Promise<void> {
        if (this.shouldStop) {
            return;
        }

        let base: URL;
        let current: URL;

        try {
            base = new URL(this.baseURL);
            current = new URL(currentURL);
        } catch (error) {
            const message =
                error instanceof Error ? error.message : String(error);
            console.error(`Error: invalid URL ${currentURL}: ${message}`);
            return;
        }

        if (base.hostname !== current.hostname) {
            return;
        }

        const normalizedURL = normalizeURL(currentURL);
        const isNewPage = this.addPageVisit(normalizedURL);
        if (!isNewPage) {
            return;
        }

        console.log(`Crawling ${currentURL}`);
        const html = await this.getHTML(currentURL);
        if (!html) {
            return;
        }

        const urls = getURLsFromHTML(html, this.baseURL);
        const crawlPromises = urls.map((url) => {
            const task = this.crawlPage(url).finally(() => {
                this.allTasks.delete(task);
            });
            this.allTasks.add(task);
            return task;
        });

        await Promise.all(crawlPromises);
    }

    async crawl(): Promise<Record<string, number>> {
        const rootTask = this.crawlPage(this.baseURL).finally(() => {
            this.allTasks.delete(rootTask);
        });
        this.allTasks.add(rootTask);
        while (this.allTasks.size > 0) {
            await Promise.all([...this.allTasks]);
        }
        return this.pages;
    }
}

async function crawlSiteAsync(
    baseURL: string,
    maxConcurrency: number = 5,
    maxPages: number = 100,
): Promise<Record<string, number>> {
    const crawler = new ConcurrentCrawler(baseURL, maxConcurrency, maxPages);
    return await crawler.crawl();
}

export {
    normalizeURL,
    getH1FromHTML,
    getFirstParagraphFromHTML,
    getURLsFromHTML,
    getImagesFromHTML,
    extractPageData,
    crawlSiteAsync,
    type ExtractedPageData,
};

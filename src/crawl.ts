function normalizeURL(url: string): string {
    try {
        const normalized = new URL(url);
        normalized.hash = "";
        return normalized.toString();
    } catch (e) {
        throw new Error(`Invalid URL: ${url}`);
    }
}

export { normalizeURL };

import { crawlSiteAsync } from "./crawl";

async function main() {
    const args = process.argv.slice(2);

    if (args.length < 1) {
        console.error("Error: no base URL provided.");
        process.exit(1);
    }

    if (args.length !== 1 && args.length !== 3) {
        console.error(
            "Error: invalid arguments. Usage: pnpm run start <URL> <maxConcurrency> <maxPages>",
        );
        process.exit(1);
    }

    const baseURL = args[0];
    const maxConcurrency = args[1] ? Number(args[1]) : 5;
    const maxPages = args[2] ? Number(args[2]) : 100;

    if (!Number.isFinite(maxConcurrency) || maxConcurrency < 1) {
        console.error("Error: maxConcurrency must be a positive number.");
        process.exit(1);
    }

    if (!Number.isFinite(maxPages) || maxPages < 1) {
        console.error("Error: maxPages must be a positive number.");
        process.exit(1);
    }

    console.log(
        `Starting crawl at ${baseURL} with maxConcurrency=${maxConcurrency} and maxPages=${maxPages}`,
    );
    const pages = await crawlSiteAsync(baseURL, maxConcurrency, maxPages);

    for (const [url, count] of Object.entries(pages)) {
        console.log(`Crawled ${url} (${count})`);
    }
    process.exitCode = 0;
}

main();

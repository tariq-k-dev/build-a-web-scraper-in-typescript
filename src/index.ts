import { getHTML } from "./crawl";

async function main() {
    const args = process.argv.slice(2);

    if (args.length < 1) {
        console.error("Error: no base URL provided.");
        process.exit(1);
    }

    if (args.length > 1) {
        console.error(
            "Error: too many arguments. Provide exactly one base URL.",
        );
        process.exit(1);
    }

    const baseURL = args[0];
    console.log(`Starting crawl at ${baseURL}`);
    await getHTML(baseURL);
    process.exitCode = 0;
}

main();

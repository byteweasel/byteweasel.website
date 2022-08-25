"use strict";

import beautify from "metalsmith-beautify";
import browserSync from "browser-sync";
import collections from "@metalsmith/collections";
import dateFormatter from "metalsmith-date-formatter";
import excerpts from "@metalsmith/excerpts";
import markdown from "metalsmith-markdown";
import { Renderer } from "marked";
import metalsmith from "metalsmith";
import layouts from "@metalsmith/layouts";
import pagination from "metalsmith-pagination";
import permalinks from "@metalsmith/permalinks";
import prism from "metalsmith-prism";
import sass from "metalsmith-sass";
import sitemap from "metalsmith-sitemap";
import copyProp from "./src/libs/metalsmith-copy-prop.js";
import topics from "./src/libs/metalsmith-topics.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const config = {
    mainMenu:
    {
        Home: "/",
        Projects: "/projects",
        Topics: "/topics",
        About: "/about",
    },
};

const markdownRenderer = new Renderer();
markdownRenderer.image = function (href, title) {
    return `
      <div class="image-container">
        <img src="${href}" alt="${title}" title="${title}" />
      </div>`;
};

function build(callback) {
    metalsmith(__dirname)
        .metadata(config)
        .clean(true)
        .source("./src")
        .destination("./out")
        .ignore([
            "libs",
            "templates",
            "**/src/css/!(styles.scss|atom-dark-prism.css)",
        ])
        .use(collections({
            posts: {
                pattern: "posts/*.md",
                sortBy: "date",
                reverse: true,
            },
            projects: {
                sortBy: "date",
                reverse: true,
            },
            menus: {
                pattern: "pages/*.md",
            },
        }))
        .use(pagination({
            "collections.posts": {
                perPage: 5,
                first: "index.html",
                path: "pages/:num/index.html",
                index: "index.html",
                layout: "index.njk",
            }
        }))
        .use(pagination({
            "collections.projects": {
                perPage: 5,
                first: "projects/index.html",
                path: "projects/pages/:num/index.html",
                index: "projects\\index.html",
                layout: "projects.njk",
            }
        }))
        .use(markdown({
            renderer: markdownRenderer,
            langPrefix: "language-",
            pedantic: false,
            gfm: true,
            tables: true,
            breaks: false,
            sanitize: false,
            smartLists: true,
            smartypants: false,
            xhtml: false,
        }))
        .use(prism())
        .use(copyProp({
            from: "contents",
            to: "initialContents",
            pattern: "posts/*.html",
        }))
        .use(excerpts())
        .use(sass({
            outputDir: "css/",
        }))
        .use(permalinks({
            relative: false,
            pattern: ":title",
            linksets: [
                {
                    match: { collection: "posts" },
                    pattern: "posts/:date/:title",
                },
                {
                    match: { collection: "menus" },
                    pattern: ":title",
                },
            ],
        }))
        .use(copyProp({
            from: "date",
            to: "rawDate",
            pattern: "posts/*.html",
        }))
        .use(dateFormatter({
            dates: [
                {
                    key: "date",
                    format: "ddd, MMMM Do YYYY",
                },
            ],
        }))
        .use(topics({
            sort: "rawDate",
        }))
        .use(layouts({
            directory: "./src/templates",
            pattern: "**/*.html",
            default: "page.njk",
        }))
        .use(beautify())
        .use(sitemap({
            hostname: "http://byteweasel.com",
        }))
        .build((err) => {
            const message = err || "Build complete";
            console.log(message);
            callback();
        });
}

const args = process.argv.slice(2);
if (args.length) {
    browserSync({
        server: "out",
        files: ["src/**/*.*"],
        middleware: (req, res, next) => {
            build(next);
        },
    });
} else {
    build(() => {
    });
}

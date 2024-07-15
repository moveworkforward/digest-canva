const { Buffer } = require("node:buffer");
const fs = require("node:fs");
const path = require("node:path");
const shell = require("shelljs");

// inspired by https://github.com/evanw/esbuild/issues/1685
const excludeVendorFromSourceMap = ({ includes = [] }) => ({
    name: "excludeVendorFromSourceMap",
    setup(build) {
        const emptySourceMap =
        "\n//# sourceMappingURL=data:application/json;base64," +
        Buffer.from(
            JSON.stringify({
                version: 3,
                sources: [""],
                mappings: "A",
            })
        ).toString("base64");

        build.onLoad({ filter: /node_modules/u }, async (args) => {
            if (
                /\.[mc]?js$/.test(args.path) &&
                !new RegExp(includes.join("|"), "u").test(
                    args.path.split(path.sep).join(path.posix.sep)
                )
            ) {
                return {
                    contents: `${await fs.promises.readFile(
                        args.path,
                        "utf8"
                    )}${emptySourceMap}`,
                    loader: "default",
                };
            }
        });
    },
});

const sentryPlugin = {
    name: "upload-sourcemaps",
    setup(build) {
        build.onEnd(args => {
            if (!args || !args.outputFiles) {
                return;
            }

            for (const file of args.outputFiles) {
                const fileObj = path.parse(file.path);
                fs.mkdirSync(fileObj.dir, { recursive: true });
                fs.writeFileSync(file.path, file.contents);
            }
        
            // Inject Debug IDs in Source Code for Sentry
            if (process.env.STAGE === "prod") {
                const sentryDebugIdsCmd = "sentry-cli sourcemaps inject \".esbuild/.build\"";
                const sentryDebugIdsResult = shell.exec(sentryDebugIdsCmd);
                if (sentryDebugIdsResult.code !== 0) {
                    shell.echo("Error injecting debug ids in source files for Sentry.");
                }
            }
        });
    },
};
  
module.exports = [excludeVendorFromSourceMap({ includes: ["@moveworkforward/um-clientlib"] }), sentryPlugin];

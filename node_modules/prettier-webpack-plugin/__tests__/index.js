const webpack = require("webpack");
const PrettierPlugin = require("../index.js");
const uuid = require("uuid").v4;
const fs = require("fs");

const sampleCodeFilename = "./__tests__/sample-code.js";
const sampleCode = fs.readFileSync(sampleCodeFilename, { encoding: "utf8" });

const bundle = (config, alternative) => {
  return new Promise((resolve, reject) => {
    webpack(config, (err, stats) => {
      if (err) return reject(err);

      const errors = stats.toString("errors-only");
      if (errors) return reject(errors);

      // If we provided an alternative target, compare it to sample code
      const target = alternative ? alternative : config.entry;
      fs.readFile(target, { encoding: "utf8" }, (err, code) => {
        if (err) return reject(err);

        let didFileUpdate = false;
        if (code !== sampleCode) didFileUpdate = true;
        if (!didFileUpdate) return reject("File did not change!");

        resolve(code);
      });
    });
  });
};

const prepareEntryWithExtras = async (code, extras, file) => {
  return new Promise((resolve, reject) => {
    let fileContents = "";
    extras.forEach(extra => {
      fileContents += extra + "\n";
    });
    fileContents += code;

    fs.writeFile(file, fileContents, err => {
      if (err) reject(err);
      else resolve();
    });
  });
};

const prepareEntry = async (code, file) => {
  return new Promise((resolve, reject) => {
    fs.writeFile(file, code, err => {
      if (err) reject(err);
      else resolve();
    });
  });
};

const teardown = path => {
  fs.readdir(path, (err, filenames) => {
    filenames.forEach(file => {
      const curPath = path + "/" + file;
      if (fs.lstatSync(curPath).isDirectory()) teardown(curPath);
      else fs.unlinkSync(curPath);
    });
    fs.rmdirSync(path);
  });
};

describe("unit tests", () => {
  beforeAll(() => {
    if (!fs.existsSync("./temp")) fs.mkdirSync("./temp");
  });

  afterAll(() => {
    teardown("./temp");
  });

  it("prettifies source", async () => {
    const input = `./temp/${uuid()}.js`;
    const output = `./temp/${uuid()}.js`;
    await prepareEntry(sampleCode, input);
    const processed = await bundle({
      entry: input,
      output: { filename: output },
      plugins: [new PrettierPlugin()]
    });
    return expect(processed).toMatchSnapshot();
  });

  it("ignores unexpected config options in case they are for prettier", async () => {
    const input = `./temp/${uuid()}.js`;
    const output = `./temp/${uuid()}.js`;
    await prepareEntry(sampleCode, input);
    return bundle({
      entry: input,
      output: { filename: output },
      plugins: [new PrettierPlugin({ maybeForPrettier: true })]
    });
  });

  it("respects prettier config options", async () => {
    const input = `./temp/${uuid()}.js`;
    const output = `./temp/${uuid()}.js`;

    await prepareEntry(sampleCode, input);
    let processed = await bundle({
      entry: input,
      output: { filename: output },
      plugins: [new PrettierPlugin({ singleQuote: true })]
    });
    expect(processed).toMatchSnapshot();

    await prepareEntry(sampleCode, input);
    processed = await bundle({
      entry: input,
      output: { filename: output },
      plugins: [new PrettierPlugin({ singleQuote: false })]
    });
    return expect(processed).toMatchSnapshot();
  });

  it("respects prettier config options from file", async () => {
    const input = `./temp/${uuid()}.js`;
    const output = `./temp/${uuid()}.js`;

    await prepareEntry(sampleCode, input);
    let processed = await bundle({
      entry: input,
      output: { filename: output },
      plugins: [new PrettierPlugin({ configFile: `${process.cwd()}/prettier.config.json` })]
    });
    expect(processed).toMatchSnapshot();

    await prepareEntry(sampleCode, input);
    processed = await bundle({
      entry: input,
      output: { filename: output },
      plugins: [new PrettierPlugin({ singleQuote: false, configFile: `${process.cwd()}/prettier.config.json` })]
    });
    return expect(processed).toMatchSnapshot();
  });

  // TODO: Why does this fail to catch Prettier > `jest-validate` Validation Error?
  // it("throws on invalid prettier config options", async () => {
  //   const input = `./temp/${uuid()}.js`;
  //   const output = `./temp/${uuid()}.js`;
  //
  //   await prepareEntry(sampleCode, input);
  //
  //   return expect(
  //     bundle({
  //       entry: input,
  //       output: { filename: output },
  //       plugins: [new PrettierPlugin({ singleQuote: () => null })]
  //     })
  //   ).rejects.toMatchSnapshot();
  // });

  it("only processes files with specified extensions", async () => {
    const entry = `./temp/${uuid()}.js`;
    const moduleUUID = uuid();
    const module = `./temp/${moduleUUID}.jsx`;
    const moduleRelativeToEntry = `./${moduleUUID}.jsx`;
    const output = `./temp/${uuid()}.js`;

    await Promise.all([
      prepareEntryWithExtras(
        sampleCode,
        [`const module = require("${moduleRelativeToEntry}")`],
        entry
      ),
      prepareEntry(sampleCode, module)
    ]);

    // Expect the module to not change
    return expect(
      bundle(
        {
          entry: entry,
          mode: 'development',
          output: { filename: output },
          plugins: [new PrettierPlugin({ extensions: [".js"] })]
        },
        module
      )
    ).rejects.toBe("File did not change!");
  });
});

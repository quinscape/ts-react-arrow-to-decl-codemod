const assert = require("assert")
const fs = require("fs")
const sh = require("shelljs")

const logFile = "test/cli-test-log.txt"

describe("Transform script", function(){
    it("works via actual jscodeshift CLI", function()
    {
        before(
            () => {
                sh.cp("test/Test.tsx.bak", "test/Test.tsx")
                sh.rm(logFile)
            }
        )

        sh.exec("./node_modules/.bin/jscodeshift -t index.js test/Test.tsx > " + logFile)

        const source = fs.readFileSync("test/Test.tsx", "utf8")
        const expected = fs.readFileSync("test/Test-expected.tsx", "utf8")

        assert.equal(source, expected, "Output of transform does not match contents of Test-expected.tsx. See " + logFile + " for details.");

    });
});

const jscodeshift = require("jscodeshift")
const assert = require("assert")
const tsxParser = require("jscodeshift/parser/tsx.js")

const negativeKeyList = ["loc", "start", "end", "indent", "lines", "tokens", "extra", "__childCache", "parentPath", "interpreterf"]

// Returns simplified JSON for given AST node and its children.
function jsonify(o)
{
    return JSON.stringify(
        o,
        (k, v) => negativeKeyList.indexOf(k) >= 0 ? undefined : v,
        4
    );
}

const parser = tsxParser()


let codemod;
function transform(code)
{
    return codemod({ source: (code), parser }, { jscodeshift: jscodeshift.withParser(parser) })
}

function assertChange(from, to)
{
    assert.equal(
        transform(from),
        to,
        "Code transform failed expectation on: " + from
    )
}

function assertUnchanged(code)
{
    assert(transform(code) === code, "Code is unchanged:" + code)
}


describe("React Arrow to Function Def", function(){

    before(() => {
        codemod = require("../index.js").default;
    })

    it("transforms arrow functions into traditional functions", function()
    {

        assertChange(
            // language=TypeScript
            `
            interface MyComponentProps {}

            /**
             * AAA
             */
            const MyComponent = (props: MyComponentProps) => { return false }`,
            // language=TypeScript
            `
            interface MyComponentProps {}

            /**
             * AAA
             */
            function MyComponent(props: MyComponentProps) { return false }`
        );

    });


    it("supports exports", function()
    {

        assertChange(
            // language=TypeScript
            `
                interface MyComponentProps {}

                /**
                 * BBB
                 */
                export const MyComponent = (props: MyComponentProps) => { return false }`,
            // language=TypeScript
            `
                interface MyComponentProps {}

                /**
                 * BBB
                 */
                export function MyComponent(props: MyComponentProps) { return false }`
        );

    });


    it("supports inline destructuring", function()
    {
        assertChange(
            // language=TypeScript JSX
            `
                interface MyComponentProps {name : String, value: Number }
                const MyComponent = ({name, value}: MyComponentProps) => { return false }`,
            // language=TypeScript JSX
            `
                interface MyComponentProps {name : String, value: Number }
                function MyComponent({name, value}: MyComponentProps) { return false }`
        );

        //assertUnchanged("const a = 1")
    });


    it("only transforms top-level declarations", function()
    {

        assertUnchanged(
            // language=TypeScript JSX
            `
                class TestClass
                {
                    static method()
                    {
                        interface MyComponentProps
                        {
                        }

                        const MyComponent = (props: MyComponentProps) =>
                        {
                            return false;
                        };
                    }
                    method()
                    {
                        interface InnerComponent4Props
                        {
                        }

                        const InnerComponent2 = (props: InnerComponent4Props) =>
                        {
                            return false;
                        };

                    }
                }`
        )

        assertUnchanged(
            // language=TypeScript JSX
            `
                function RootComponent2(props)
                {
                    interface MyComponentProps
                    {
                    }

                    const MyComponent = (props: MyComponentProps) =>
                    {
                        return false;
                    };

                    return false;
                }`
        )
    });

});

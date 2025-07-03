/**
 * codemod script for jscodeshift
 *
 * Usage:
 *
 * npx jscodeshift -t <location of this file> <tsx files to transform>
 */

const negativeKeyList = ["loc", "start", "end", "indent", "lines", "tokens", "extra"]

// Returns simplified JSON for give AST node and its children.
function jsonify(o)
{
   return JSON.stringify(
      o,
      (k, v) => negativeKeyList.indexOf(k) >= 0 ? undefined : v,
      4
   );
}

function isInModuleScope(path)
{
   do
   {
      path = path.parentPath

      if (path && path.node && path.node.type === "BlockStatement")
      {
         return false;
      }

   } while (path)
   return true
}

function isComponentDefinedAsArrowFunction(node)
{
   return (
      node.type === "ArrowFunctionExpression" &&
      node.params.length === 1 &&
      node.params[0].name === "props"

   )
}

export default function transformer(file, api) {
   const j = api.jscodeshift;

   let jFile = j(file.source);

   jFile.forEach(p => require("fs").writeFileSync("test.json", jsonify(p), "utf-8")); // Dump complete AST to "./test.json"

   return jFile
      .find(j.VariableDeclaration)
      .filter(path => {

         // to qualify, the declaration has to be in the module scope ...
         if (!isInModuleScope(path))
         {
            return false;
         }

         // and has to contain at least one component definition.
         const {declarations} = path.node;
         for (let i = 0; i < declarations.length; i++)
         {
            const node = declarations[i];
            if (isComponentDefinedAsArrowFunction(node.init))
            {
               return true;
            }
         }
         return false;
      })
      .forEach(path => {
         //console.log("FOUND", path.node.type)

         const components = []

         const { comments } = path.node

         const {declarations} = path.node;
         const remainingDeclarations = []
         for (let i = 0; i < declarations.length; i++)
         {
            const node = declarations[i];
            if (isComponentDefinedAsArrowFunction(node.init))
            {
               components.push({name: node.id.name, fn: node.init, comments: i === 0 ? comments : null });
            } else
            {
               remainingDeclarations.push(node);
            }
         }

         const nodeAsRoot = j(path)

         // convert collected components to function declarations and insert them after the variable declaration node
         for (let i = components.length - 1; i >= 0; i--)
         {
            const {name, fn, comments } = components[i];
            nodeAsRoot.insertAfter(p => {

               const funcDecl = j.functionDeclaration(j.identifier(name), fn.params, fn.body);
               if (comments)
               {
                  // restore comments of declaration on first component
                  funcDecl.comments = comments;
               }
               return funcDecl;
            })
         }

         // replace or remove original declarations depending on whether we have declarators left.
         if (remainingDeclarations.length)
         {
            nodeAsRoot.replaceWith(path => j.variableDeclaration("const", remainingDeclarations))
         } else
         {
            nodeAsRoot.remove()
         }

      })
      .toSource()
}

module.exports.parser = "tsx"


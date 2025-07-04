/**
 * codemod script for jscodeshift
 *
 * Usage:
 *
 * npx jscodeshift -t <location of this file> <tsx files to transform>
 */

const negativeKeyList = ["loc", "start", "end", "indent", "lines", "tokens", "extra", "__childCache", "parentPath"]

// Returns simplified JSON for given AST node and its children.
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

function parentIsExportNamedDeclaration(path)
{
   return !!(path.parentPath && path.parentPath.node && path.parentPath.node.type === "ExportNamedDeclaration");
}


function endsWithProps(s)
{
    const suffix = "Props"
    const pos = s.lastIndexOf(suffix)
    return pos === s.length - suffix.length
}


function isComponentDefinedAsArrowFunction(node, j)
{
   if (
      node.type !== "ArrowFunctionExpression" ||
      node.params.length !== 1
   )
   {
       return false
   }

   const param = node.params[0];

   return (
         j.Identifier.check(param) && param.name === "props" ||
         param.typeAnnotation && param.typeAnnotation.typeAnnotation && param.typeAnnotation.typeAnnotation.type === "TSTypeReference"  && endsWithProps(param.typeAnnotation.typeAnnotation.typeName.name)
   )
}

export default function transformer(file, api) {
   const j = api.jscodeshift;

   let jFile = j(file.source);

   //jFile.forEach(p => require("fs").writeFileSync("test.json", jsonify(p), "utf8")); // Dump complete AST to "./test.json"

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
            if (isComponentDefinedAsArrowFunction(node.init, j))
            {
               return true;
            }
         }
         return false;
      })
      .forEach(path => {
         //console.log("FOUND", path.node.type)

         const components = []

         const isExport = parentIsExportNamedDeclaration(path)

         const { comments } = isExport ? path.parentPath.node : path.node

         const {declarations, kind} = path.node;
         const remainingDeclarations = []
         for (let i = 0; i < declarations.length; i++)
         {
            const node = declarations[i];
            if (isComponentDefinedAsArrowFunction(node.init, j))
            {
               components.push({name: node.id.name, fn: node.init, comments: i === 0 ? comments : null });
            } else
            {
               remainingDeclarations.push(node);
            }
         }

         const nodeAsRoot = j(isExport ? path.parentPath : path)

         // convert collected components to function declarations and insert them after the variable declaration node
         for (let i = components.length - 1; i >= 0; i--)
         {
            const {name, fn, comments } = components[i];
            nodeAsRoot.insertAfter(p => {

               let funcDecl = j.functionDeclaration(j.identifier(name), fn.params, fn.body);

               if (isExport)
               {
                  funcDecl = j.exportNamedDeclaration(funcDecl)
               }

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
             let newDecl = j.variableDeclaration(kind, remainingDeclarations)
             if (isExport)
             {
                 newDecl = j.exportNamedDeclaration(newDecl)
             }
             nodeAsRoot.replaceWith(path => newDecl)
         } else
         {
            nodeAsRoot.remove()
         }

      })
      .toSource()
}

export const parser = "tsx"


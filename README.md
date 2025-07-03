# ts-react-arrow-to-decl-codemod

A codemod script for jscodeshift that replaces arrow function components like this

```javascript
const MyComponent = (props : MyComponentProps) => { ... }
```

to traditional function declarations

```javascript
function MyComponent(props : MyComponentProps) => { ... }
```

This is done in order to provide a `name` property to the react components
which is used in component stack traces and within the 
React Developer Extension and other tools.

Usage:

npx @quinscape/ts-react-arrow-to-decl-codemod <jscodeshift-options> <files>


# ts-react-arrow-to-decl-codemod

A codemod script for jscodeshift that replaces arrow function components like this

```typescript
const MyComponent = (props : MyComponentProps) => 
{ 
    // ...
}
```

to traditional function declarations

```typescript
function MyComponent(props : MyComponentProps)
{  
    // ...
}
```

This is done in order to provide a `name` property to the react components
which is used in component stack traces and within the 
React Developer Extension and other tools.

Usage:

Clone this repo to get the transform script or use 
[jscodeshift with this URL as transform](https://raw.githubusercontent.com/quinscape/ts-react-arrow-to-decl-codemod/refs/heads/main/index.js) 
(Might not be up-to-date if changes happened recently)

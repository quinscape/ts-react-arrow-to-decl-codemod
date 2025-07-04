# ts-react-arrow-to-decl-codemod

A codemod script for jscodeshift that replaces arrow function components like this

```typescript
const MyComponent = (props) => 
{ 
    // ...
}

interface MyOtherComponentProps { name }
const MyOtherComponent = ( { name } : MyOtherComponentProps) => 
{ 
    // ...
}
```

to traditional function declarations

```typescript
function MyComponent(props) {
    // ...
}

interface MyOtherComponentProps { name }
function MyOtherComponent( { name } : MyOtherComponentProps) 
{
    // ...
}
```

To qualify for transformation, the arrow function must have a single argument named `props` or refer to a type reference
whose name ends in `Props`.

This is done in order to provide a `name` property to the react components which is used in component stack traces and 
within the React Developer Extension and other tools.

Usage:

Clone this repo to get the transform script or use 
[jscodeshift with this URL as transform](https://raw.githubusercontent.com/quinscape/ts-react-arrow-to-decl-codemod/refs/heads/main/index.js) 
(Might not be up-to-date if changes happened recently)

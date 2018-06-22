const vm = require('vm');


global.myTest = 1;

const sandbox = { x: 2 };
let ctx = vm.createContext(sandbox); // Contextify the sandbox.

const code = `
function add(y){
  console.log('test');
  x++;
  return x + y;
}

`;
// x and y are global variables in the sandboxed environment.
// Initially, x has the value 2 because that is the value of sandbox.x.
vm.runInContext(code, ctx);

console.log(sandbox.add(3));
console.log(sandbox.add(4));
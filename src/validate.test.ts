import { expect, test, describe } from "bun:test";
import { getRejectedVariables, sharedGlobalVariables, browserVariables } from './validate';

// describe('getRejectedVariables', () => {
//   test('Allow all variables, reject browser-specific variables', () => {
//     const rejected = getRejectedVariables('all', 'browser');
//     expect(rejected).toEqual(browserVariables);
//   });

//   test('Allow only shared variables, reject none', () => {
//     const rejected = getRejectedVariables(sharedGlobalVariables, []);
//     expect(rejected).toEqual([]);
//   });

//   test('Allow browser-specific variables, reject `window` and `document`', () => {
//     const rejected = getRejectedVariables('browser', ['window', 'document']);
//     expect(rejected).toEqual(['window', 'document']);
//   });
// });


const rejected = getRejectedVariables("all", []);
console.log(rejected)

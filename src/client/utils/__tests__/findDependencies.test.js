/* eslint-env jest */

import findDependencies from '../findDependencies';

it('finds all imported modules', () => {
  const code = `
    import base64 from 'base64';
    import debounce from 'lodash/debounce';
    import { connect } from 'react-redux';
  `;

  const { dependencies } = findDependencies(code);

  expect(dependencies).toEqual({ base64: null, 'lodash/debounce': null, 'react-redux': null });
});

it('finds all required modules', () => {
  const code = `
    const base64 = require('base64');
    const debounce = require('lodash/debounce');
    const { connect } = require('react-redux');
  `;

  const { dependencies } = findDependencies(code);

  expect(dependencies).toEqual({ base64: null, 'lodash/debounce': null, 'react-redux': null });
});

it('finds all required modules with backticks', () => {
  const code = `
    const base64 = require(\`base64\`);
    const debounce = require(\`lodash/debounce\`);
    const { connect } = require(\`react-redux\`);
  `;

  const { dependencies } = findDependencies(code);

  expect(dependencies).toEqual({ base64: null, 'lodash/debounce': null, 'react-redux': null });
});

it('finds all required modules with version comments', () => {
  const code = `
    const base64 = require('base64'); // 2.4.1
    const { connect } = require(\`react-redux\`); // 3.5.2
  `;

  const { dependencies } = findDependencies(code);

  expect(dependencies).toEqual({ base64: '2.4.1', 'react-redux': '3.5.2' });
});

it('finds dependencies using all import styles', () => {
  const code = `
    import v from "mod1"
    import * as ns from "mod2";
    import {x} from "mod3";
    import {x as v} from "mod4";
    import "mod5";

    export {x} from "mod6";
    export {x as v} from "mod7";
    export * from "mod8";

    export default 7;
    export const value = 6;
    const otherValue = 5;
    export { otherValue }
  `;

  const { dependencies } = findDependencies(code);

  expect(dependencies).toEqual({
    mod1: null,
    mod2: null,
    mod3: null,
    mod4: null,
    mod5: null,
    mod6: null,
    mod7: null,
    mod8: null,
  });
});

it('finds dependencies with version comments', () => {
  const code = `
    import v from "mod1" // 2.4.1
    import * as ns from "mod2"; // 3.5.2
    import {x} from "mod3"; // 4.6.3
    import {x as v} from "mod4"; // 5.7.4
    import "mod5"; // 6.8.5

    export {x} from "mod6"; // 7.9.6
    export {x as v} from "mod7"; // 8.0.7
    export * from "mod8"; // 9.1.8
  `;

  const { dependencies } = findDependencies(code);

  expect(dependencies).toEqual({
    mod1: '2.4.1',
    mod2: '3.5.2',
    mod3: '4.6.3',
    mod4: '5.7.4',
    mod5: '6.8.5',
    mod6: '7.9.6',
    mod7: '8.0.7',
    mod8: '9.1.8',
  });
});

it('removes version comments', () => {
  const code = `
    import v from "mod1" // 2.4.1
    import * as ns from "mod2"; // 3.5.2
    import {x} from "mod3"; // 4.6.3
    import {x as v} from "mod4"; // 5.7.4
    import "mod5"; // 6.8.5

    const base64 = require('base64'); // 0.2.9
    const { connect } = require('react-redux'); // 1.3.0

    export {x} from "mod6"; // 7.9.6
    export {x as v} from "mod7"; // 8.0.7
    export * from "mod8"; // 9.1.8
  `;

  const { code: result } = findDependencies(code, true);

  expect(result).toEqual(`
    import v from "mod1";
    import * as ns from "mod2";
    import { x } from "mod3";
    import { x as v } from "mod4";
    import "mod5";

    const base64 = require('base64');
    const { connect } = require('react-redux');

    export { x } from "mod6";
    export { x as v } from "mod7";
    export * from "mod8"
  `);
});

it("doesn't parse non-static and invalid requires", () => {
  const code = `
    const base64 = require();
    const uuid = require('');
    const debounce = require('debounce', null);
    const moment = require(\`\${name}\`);
    const leftpad = require(\`left-\${name}\`);
    const core = require('/core');
    const promise = require('promise\\nme');
    const bluebird = require(\`blue
      bird
    \`);
    const ten = require(10);
  `;

  const { dependencies } = findDependencies(code);

  expect(dependencies).toEqual({});
});

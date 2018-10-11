/* eslint-env jest */

import findDependencies from '../findDependencies';

it('finds all imported modules', () => {
  const code = `
    import base64 from 'base64';
    import debounce from 'lodash/debounce';
    import { connect } from 'react-redux';
  `;

  const dependencies = findDependencies(code);

  expect(dependencies).toEqual(['base64', 'lodash/debounce', 'react-redux']);
});

it('finds all required modules', () => {
  const code = `
    const base64 = require('base64');
    const debounce = require('lodash/debounce');
    const { connect } = require('react-redux');
  `;

  const dependencies = findDependencies(code);

  expect(dependencies).toEqual(['base64', 'lodash/debounce', 'react-redux']);
});

it('finds all required modules with backticks', () => {
  const code = `
    const base64 = require(\`base64\`);
    const debounce = require(\`lodash/debounce\`);
    const { connect } = require(\`react-redux\`);
  `;

  const dependencies = findDependencies(code);

  expect(dependencies).toEqual(['base64', 'lodash/debounce', 'react-redux']);
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

  const dependencies = findDependencies(code);
  expect(dependencies).toEqual(['mod1', 'mod2', 'mod3', 'mod4', 'mod5', 'mod6', 'mod7', 'mod8']);
});

it('de-duplicates dependency list', () => {
  const code = `
    import 'base64';
    import 'base64';
    import 'lodash';
  `;

  const dependencies = findDependencies(code);
  expect(dependencies).toEqual(['base64', 'lodash']);
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

  const dependencies = findDependencies(code);

  expect(dependencies).toEqual([]);
});

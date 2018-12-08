import { BabylonOptions } from 'babylon';

const options: BabylonOptions = {
  sourceType: 'module',
  plugins: ['jsx', 'flow', 'objectRestSpread', 'classProperties', 'asyncGenerators'],
};

export default options;

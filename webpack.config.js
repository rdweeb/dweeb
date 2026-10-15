// i installed webpack once. i do not know why. it is here now.
// if you run it, nothing happens. i tested. it is very quiet.
module.exports = {
  mode: 'maybe',
  entry: './the-entry.js',   // does not exist
  output: { filename: 'bundle.js', path: '/somewhere' },
  module: { rules: [ /* rules? in this economy */ ] }
};

/* global ace */

import * as lightColors from './colors-light';
import * as darkColors from './colors-dark';
import colors from '../../../configs/colors';

const css = String.raw;

const theme = ({ ui, syntax }, name) => css`
  .${name} .ace_gutter {
    background: none;
    color: #999;
    border-right: 1px solid ${colors.border};
  }

  .${name} .ace_print-margin {
    width: 1px;
    background: #e8e8e8;
  }

  .${name} {
    background-color: ${ui.background};
    color: ${ui.text};
  }

  .${name} .ace_cursor {
    color: #ff6a00;
  }

  .${name} .ace_marker-layer .ace_selection {
    background: rgba(0, 0, 0, 0.16);
  }

  .${name}.ace_multiselect .ace_selection.ace_start {
    box-shadow: 0 0 3px 0px #fafafa;
    border-radius: 2px;
  }

  .${name} .ace_marker-layer .ace_step {
    background: rgb(198, 219, 174);
  }

  .${name} .ace_marker-layer .ace_bracket {
    margin: -1px 0 0 -1px;
    border: 1px solid #ff0000;
  }

  .${name} .ace_marker-layer .ace_active-line {
    background: #f2f2f2;
  }

  .${name} .ace_gutter-active-line {
    background-color: #f2f2f2;
  }

  .${name} .ace_marker-layer .ace_selected-word {
    border: 1px solid #f0eee4;
  }

  .${name} .ace_fold {
    background-color: #f29718;
    border-color: #5c6773;
  }

  .${name} .ace_keyword {
    color: ${syntax.keyword};
  }

  .${name} .ace_keyword.ace_other.ace_unit {
    color: ${syntax.number};
  }

  .${name} .ace_constant.ace_language {
    color: ${syntax.number};
  }

  .${name} .ace_constant.ace_numeric {
    color: ${syntax.number};
  }

  .${name} .ace_constant.ace_character {
    color: ${syntax.number};
  }

  .${name} .ace_constant.ace_character.ace_escape {
    color: ${syntax.regexp};
  }

  .${name} .ace_support.ace_function {
    color: ${syntax.keyword};
  }

  .${name} .ace_support.ace_constant {
    color: ${syntax.constant};
  }

  .${name} .ace_support.ace_class {
    color: ${syntax.property};
  }

  .${name} .ace_support.ace_type {
    color: ${syntax.property};
  }

  .${name} .ace_storage.ace_type {
    color: ${syntax.property};
  }

  .${name} .ace_invalid {
    color: ${syntax.invalid};
  }

  .${name} .ace_invalid.ace_deprecated {
    color: #ffffff;
    background-color: ${syntax.invalid};
  }

  .${name} .ace_string {
    color: ${syntax.string};
  }

  .${name} .ace_string.ace_regexp {
    color: ${syntax.regexp};
  }

  .${name} .ace_comment {
    font-style: italic;
    color: ${syntax.comment};
  }

  .${name} .ace_variable {
    color: ${syntax.variable};
  }

  .${name} .ace_variable.ace_language {
    font-style: italic;
    color: ${syntax.constant};
  }

  .${name} .ace_variable.ace_parameter {
    color: ${syntax.annotation};
  }

  .${name} .ace_meta.ace_tag {
    color: ${syntax.tag};
  }

  .${name} .ace_entity.ace_other.ace_attribute-name {
    color: ${syntax.property};
  }

  .${name} .ace_entity.ace_name.ace_function {
    color: ${syntax.keyword};
  }

  .${name} .ace_entity.ace_name.ace_tag {
    color: ${syntax.tag};
  }

  .${name} .ace_markup.ace_heading {
    color: ${syntax.string};
  }

  .${name} .ace_tooltip {
    background-image: none;
    background-color: #fbfbfb;
    border-color: lightgrey;
  }

  .${name} .ace_search {
    background-color: #fff;
    border-color: ${colors.border};
  }

  .${name} .ace_search_form,
  .${name} .ace_replace_form {
    border-color: ${colors.border};
  }
`;

ace.define('ace/theme/snack-light', ['require', 'exports', 'module', 'ace/lib/dom'], function(
  acequire,
  exports,
  module
) {
  const name = 'ace-theme-snack-light';

  exports.isDark = false;
  exports.cssClass = name;
  exports.cssText = theme(lightColors, name);

  var dom = acequire('../lib/dom');
  dom.importCssString(exports.cssText, exports.cssClass);
});

ace.define('ace/theme/snack-dark', ['require', 'exports', 'module', 'ace/lib/dom'], function(
  acequire,
  exports,
  module
) {
  const name = 'ace-theme-snack-dark';

  exports.isDark = true;
  exports.cssClass = name;
  exports.cssText = theme(darkColors, name);

  var dom = acequire('../lib/dom');
  dom.importCssString(exports.cssText, exports.cssClass);
});

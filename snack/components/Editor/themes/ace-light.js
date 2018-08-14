/* global ace */

import colors from '../../../configs/colors';

const css = String.raw;

const cssText = css`
  .ace-theme-snack-light .ace_gutter {
    background: none;
    color: #999;
    border-right: 1px solid ${colors.border};
  }

  .ace-theme-snack-light .ace_print-margin {
    width: 1px;
    background: #e8e8e8;
  }

  .ace-theme-snack-light {
    background-color: #fafafa;
    color: #5c6773;
  }

  .ace-theme-snack-light .ace_cursor {
    color: #ff6a00;
  }

  .ace-theme-snack-light .ace_marker-layer .ace_selection {
    background: rgba(0, 0, 0, 0.16);
  }

  .ace-theme-snack-light.ace_multiselect .ace_selection.ace_start {
    box-shadow: 0 0 3px 0px #fafafa;
    border-radius: 2px;
  }

  .ace-theme-snack-light .ace_marker-layer .ace_step {
    background: rgb(198, 219, 174);
  }

  .ace-theme-snack-light .ace_marker-layer .ace_bracket {
    margin: -1px 0 0 -1px;
    border: 1px solid #ff0000;
  }

  .ace-theme-snack-light .ace_marker-layer .ace_active-line {
    background: #f2f2f2;
  }

  .ace-theme-snack-light .ace_gutter-active-line {
    background-color: #f2f2f2;
  }

  .ace-theme-snack-light .ace_marker-layer .ace_selected-word {
    border: 1px solid #f0eee4;
  }

  .ace-theme-snack-light .ace_fold {
    background-color: #f29718;
    border-color: #5c6773;
  }

  .ace-theme-snack-light .ace_keyword {
    color: #f2590c;
  }

  .ace-theme-snack-light .ace_keyword.ace_other.ace_unit {
    color: #a37acc;
  }

  .ace-theme-snack-light .ace_constant.ace_language {
    color: #a37acc;
  }

  .ace-theme-snack-light .ace_constant.ace_numeric {
    color: #a37acc;
  }

  .ace-theme-snack-light .ace_constant.ace_character {
    color: #a37acc;
  }

  .ace-theme-snack-light .ace_constant.ace_character.ace_escape {
    color: #4dbf99;
  }

  .ace-theme-snack-light .ace_support.ace_function {
    color: #f29718;
  }

  .ace-theme-snack-light .ace_support.ace_constant {
    color: #a37acc;
  }

  .ace-theme-snack-light .ace_support.ace_class {
    color: #41a6d9;
  }

  .ace-theme-snack-light .ace_support.ace_type {
    color: #41a6d9;
  }

  .ace-theme-snack-light .ace_storage.ace_type {
    color: #f2590c;
  }

  .ace-theme-snack-light .ace_invalid {
    color: #ff3333;
  }

  .ace-theme-snack-light .ace_invalid.ace_deprecated {
    color: #ffffff;
    background-color: #f2590c;
  }

  .ace-theme-snack-light .ace_string {
    color: #86b300;
  }

  .ace-theme-snack-light .ace_string.ace_regexp {
    color: #4dbf99;
  }

  .ace-theme-snack-light .ace_comment {
    font-style: italic;
    color: #abb0b6;
  }

  .ace-theme-snack-light .ace_variable {
    color: #5c6773;
  }

  .ace-theme-snack-light .ace_variable.ace_language {
    font-style: italic;
    color: #41a6d9;
  }

  .ace-theme-snack-light .ace_variable.ace_parameter {
    color: #a37acc;
  }

  .ace-theme-snack-light .ace_meta.ace_tag {
    color: #e7c547;
  }

  .ace-theme-snack-light .ace_entity.ace_other.ace_attribute-name {
    color: #f2590c;
  }

  .ace-theme-snack-light .ace_entity.ace_name.ace_function {
    color: #f29718;
  }

  .ace-theme-snack-light .ace_entity.ace_name.ace_tag {
    color: #41a6d9;
  }

  .ace-theme-snack-light .ace_markup.ace_heading {
    color: #86b300;
  }

  .ace-theme-snack-light .ace_tooltip {
    background-image: none;
    background-color: #fbfbfb;
    border-color: lightgrey;
  }

  .ace-theme-snack-light .ace_search {
    background-color: #fff;
    border-color: ${colors.border};
  }

  .ace-theme-snack-light .ace_search_form,
  .ace-theme-snack-dark .ace_replace_form {
    border-color: ${colors.border};
  }
`;

ace.define('ace/theme/snack-light', ['require', 'exports', 'module', 'ace/lib/dom'], function(
  acequire,
  exports,
  module
) {
  exports.isDark = false;
  exports.cssClass = 'ace-theme-snack-light';
  exports.cssText = cssText;

  var dom = acequire('../lib/dom');
  dom.importCssString(exports.cssText, exports.cssClass);
});

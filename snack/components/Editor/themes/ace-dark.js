/* global ace */

import colors from '../../../configs/colors';

const css = String.raw;

const cssText = css`
  .ace-theme-snack-dark .ace_gutter {
    background: none;
    color: #999;
    border-right: 1px solid ${colors.border};
  }

  .ace-theme-snack-dark .ace_print-margin {
    width: 1px;
    background: #e8e8e8;
  }

  .ace-theme-snack-dark {
    background-color: #212733;
    color: #d9d7ce;
  }

  .ace-theme-snack-dark .ace_cursor {
    color: #ffcc66;
  }

  .ace-theme-snack-dark .ace_marker-layer .ace_selection {
    background: rgba(255, 255, 255, 0.24);
  }

  .ace-theme-snack-dark.ace_multiselect .ace_selection.ace_start {
    box-shadow: 0 0 3px 0px #212733;
    border-radius: 2px;
  }

  .ace-theme-snack-dark .ace_marker-layer .ace_step {
    background: rgb(198, 219, 174);
  }

  .ace-theme-snack-dark .ace_marker-layer .ace_bracket {
    margin: -1px 0 0 -1px;
    border: 1px solid #ff0000;
  }

  .ace-theme-snack-dark .ace_marker-layer .ace_active-line {
    background: #242b38;
  }

  .ace-theme-snack-dark .ace_gutter-active-line {
    background-color: #242b38;
  }

  .ace-theme-snack-dark .ace_marker-layer .ace_selected-word {
    border: 1px solid #343f4c;
  }

  .ace-theme-snack-dark .ace_fold {
    background-color: #ffd580;
    border-color: #d9d7ce;
  }

  .ace-theme-snack-dark .ace_keyword {
    color: #ffae57;
  }

  .ace-theme-snack-dark .ace_keyword.ace_other.ace_unit {
    color: #d4bfff;
  }

  .ace-theme-snack-dark .ace_constant.ace_language {
    color: #d4bfff;
  }

  .ace-theme-snack-dark .ace_constant.ace_numeric {
    color: #d4bfff;
  }

  .ace-theme-snack-dark .ace_constant.ace_character {
    color: #d4bfff;
  }

  .ace-theme-snack-dark .ace_constant.ace_character.ace_escape {
    color: #95e6cb;
  }

  .ace-theme-snack-dark .ace_support.ace_function {
    color: #ffd580;
  }

  .ace-theme-snack-dark .ace_support.ace_constant {
    color: #d4bfff;
  }

  .ace-theme-snack-dark .ace_support.ace_class {
    color: #5ccfe6;
  }

  .ace-theme-snack-dark .ace_support.ace_type {
    color: #5ccfe6;
  }

  .ace-theme-snack-dark .ace_storage.ace_type {
    color: #ffae57;
  }

  .ace-theme-snack-dark .ace_invalid {
    color: #ff3333;
  }

  .ace-theme-snack-dark .ace_invalid.ace_deprecated {
    color: #ffffff;
    background-color: #ffae57;
  }

  .ace-theme-snack-dark .ace_string {
    color: #bae67e;
  }

  .ace-theme-snack-dark .ace_string.ace_regexp {
    color: #95e6cb;
  }

  .ace-theme-snack-dark .ace_comment {
    font-style: italic;
    color: #5c6773;
  }

  .ace-theme-snack-dark .ace_variable {
    color: #d9d7ce;
  }

  .ace-theme-snack-dark .ace_variable.ace_language {
    font-style: italic;
    color: #5ccfe6;
  }

  .ace-theme-snack-dark .ace_variable.ace_parameter {
    color: #d4bfff;
  }

  .ace-theme-snack-dark .ace_meta.ace_tag {
    color: #80d4ff;
  }

  .ace-theme-snack-dark .ace_entity.ace_other.ace_attribute-name {
    color: #ffae57;
  }

  .ace-theme-snack-dark .ace_entity.ace_name.ace_function {
    color: #ffd580;
  }

  .ace-theme-snack-dark .ace_entity.ace_name.ace_tag {
    color: #5ccfe6;
  }

  .ace-theme-snack-dark .ace_markup.ace_heading {
    color: #bae67e;
  }

  .ace-theme-snack-dark .ace_tooltip {
    background-image: none;
    background-color: ${colors.ayu.mirage.background};
    border-color: ${colors.ayu.mirage.border};
    color: ${colors.ayu.mirage.text};
  }

  .ace-theme-snack-dark .ace_search {
    background-color: ${colors.ayu.mirage.background};
    border-color: ${colors.ayu.mirage.border};
  }

  .ace-theme-snack-dark .ace_search_form,
  .ace-theme-snack-dark .ace_replace_form {
    border-color: ${colors.ayu.mirage.border};
  }

  .ace-theme-snack-dark .ace_search_field,
  .ace-theme-snack-dark .ace_searchbtn,
  .ace-theme-snack-dark .ace_replacebtn,
  .ace-theme-snack-dark .ace_searchbtn_close {
    background-color: ${colors.background.dark};
    border-color: ${colors.ayu.mirage.border};
    color: inherit;
  }

  .ace-theme-snack-dark .ace_button {
    background-color: ${colors.background.dark};
    color: inherit;
  }

  .ace-theme-snack-dark .ace_button:not(.checked) {
    border-color: ${colors.ayu.mirage.border};
  }

  .ace-theme-snack-dark.ace_autocomplete {
    background-color: ${colors.ayu.mirage.background};
    border-color: ${colors.ayu.mirage.border};
    color: ${colors.ayu.mirage.text};
  }

  .ace-theme-snack-dark.ace_autocomplete .ace_completion-highlight {
    color: #ffcc66;
  }

  .ace-theme-snack-dark.ace_autocomplete .ace_marker-layer .ace_active-line,
  .ace-theme-snack-dark.ace_autocomplete .ace_marker-layer .ace_line-hover {
    background-color: rgba(255, 255, 255, 0.1);
    border-color: transparent;
  }
`;

ace.define('ace/theme/snack-dark', ['require', 'exports', 'module', 'ace/lib/dom'], function(
  acequire,
  exports,
  module
) {
  exports.isDark = true;
  exports.cssClass = 'ace-theme-snack-dark';
  exports.cssText = cssText;

  var dom = acequire('../lib/dom');
  dom.importCssString(exports.cssText, exports.cssClass);
});

module.exports = {
  deprecate: function(oldClass, oldMethod, newClass, newMethod) {
    console.warn(`Deprecation Warning. ${oldClass}#${oldMethod}() is deprecated, please use ${newClass}#${newMethod} instead.`);
  }
};
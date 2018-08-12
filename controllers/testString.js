module.exports = function testString(str) {
  if (!str) return true;
  return (str.replace(/\s/g, "") == "");
};

module.exports.getBoolean = (boolString) => {
  return boolString !== undefined && boolString.toLowerCase() === "true"
    ? true
    : false;
};

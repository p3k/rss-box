if (!String.prototype.padStart) {
  String.prototype.padStart = function(len = 0, char = ' ') {
    let str = this;
    while (str.length < len) {
      str = char + str;
    }
    return str;
  };
}

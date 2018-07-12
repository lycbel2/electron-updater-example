
let value = 0

let mm = 20;
function set(input) {
  value = input
}

function get() {
  return value
}

function student() {
  this.name = 10;
}

studento = new student();

exports.set = set
exports.get = get
exports.mm = mm;
exports.studento = studento;

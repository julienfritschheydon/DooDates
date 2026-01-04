const chrono = require("chrono-node");

const input = "réunion d'équipe dans 3 semaines";
const result = chrono.fr.parse(input, new Date(), { forwardDate: true });

console.log("Input:", input);
console.log(
  "Parsed dates:",
  result.map((r) => ({
    text: r.text,
    date: r.start.date().toISOString().split("T")[0],
  })),
);

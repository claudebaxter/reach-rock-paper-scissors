import { loadStdlib, ask } from '@reach-sh/stdlib'; //updated to ask object of @reach-sh/stdlib, reh reach standard library.
import * as backend from './build/index.main.mjs';
const stdlib = loadStdlib();

const isAlice = await ask.ask(
  `Are you Alice?`,
  ask.yesno
);
const who = isAlice ? 'Alice' : 'Bob';

console.log(`Starting Rock, Paper, Scissors! as ${who}`);

let acc = null;
const createAcc = await ask.ask( // present the user with choice of creating a test account or inputting a secret to load an existing account.
  `Would you like to create an account? (only visible on devnet)`,
  ask.yesno
);
if (createAcc) {
  acc = await stdlib.newTestAccount(stdlib.parseCurrency(1000)); // creates the test account
} else {
  const secret = await ask.ask(
    `What is your account secret?`,
    (x => x)
  );
  acc = await stdlib.newAccountFromSecret(secret); // loads the existing account
}

let ctc = null;
if (isAlice) { //branches based on whether the player is running Alice, who must deploy the contract, or Bob, who must attach it.
  ctc = acc.contract(backend); // Deploy contract and print out public info (ctc.getInfo) that can be given to the other player when it becomes available.
  ctc.getInfo().then((info) => {
    console.log(`The contract is deployed as = ${JSON.stringify(info)}`); });
} else {
  const info = await ask.ask( //request, parse, and process this information
    `Please paste the contract information:`,
    JSON.parse
  );
  ctc = acc.contract(backend, info);
}

const fmt = (x) => stdlib.formatCurrency(x, 4); //Define helper functions
const getBalance = async () => fmt(await stdlib.balanceOf(acc));

const before = await getBalance();
console.log(`Your balance is ${before}`);

const interact = { ...stdlib.hasRandom }; //Start participant in interaction interface

interact.informTimeout = () => { //Define a timeout handler
  console.log(`There was a timeout.`);
  process.exit(1);
};

if (isAlice) { //Request the wager amount or define the acceptWager method, depending on if we are Alice or not.
  const amt = await ask.ask(
    `How much do you want to wager?`,
    stdlib.parseCurrency
  );
  interact.wager = amt;
  interact.deadline = { ETH: 100, ALGO: 100, CFX: 1000}[stdlib.connector];
} else {
  interact.acceptWager = async (amt) => {
    const accepted = await ask.ask(
      `Do you accept the wager of ${fmt(amt)}?`,
      ask.yesno
    );
    if (!accepted) {
      process.exit(0);
    }
  };
}

const HAND = ['Rock', 'Paper', 'Scissors']; //define the shared getHand method
const HANDS = {
  'Rock': 0, 'R': 0, 'r': 0,
  'Paper': 1, 'P': 1, 'p': 1,
  'Scissors': 2, 'S': 2, 's': 2,
};

interact.getHand = async () => {
  const hand = await ask.ask(`What hand will you play?`, (x) => {
    const hand = HANDS[x];
    if ( hand === undefined ) {
      throw Error(`Not a valid hand ${hand}`);
    }
    return hand;
  });
  console.log(`You played ${HAND[hand]}`);
  return hand;
};

const OUTCOME = ['Bob wins', 'Draw', 'Alice wins']; //The outcome method
interact.seeOutcome = async (outcome) => {
  console.log(`The outcome is: ${OUTCOME[outcome]}`);
};

const part = isAlice ? ctc.p.Alice : ctc.p.Bob; //Choose the appropriate backend function and await its completion
await part(interact);

const after = await getBalance();
console.log(`Your balance is now ${after}`);

ask.done();
import { loadStdlib } from '@reach-sh/stdlib'; //Imports reach standard library loader
import * as backend from './build/index.main.mjs'; //Imports backend which ./reach compile will produce
const stdlib = loadStdlib(); // loads the standard library dynamically based on the REACH_CONNECTOR_MODE environment variable

const startingBalance = stdlib.parseCurrency(100); // defines a quantity of network tokens as the starting balance for each test account
const accAlice = await stdlib.newTestAccount(startingBalance); // create test accounts w/ initial endowments for Alice and Bob. This will only work on the Reach provided developer testing network.
const accBob = await stdlib.newTestAccount(startingBalance);

const fmt = (x) => stdlib.formatCurrency(x, 4); // shows a helpful function for displaying currency amounts with up to 4 decimal places.
const getBalance = async (who) => fmt(await stdlib.balanceOf(who)); // shows a helpful function for getting the balance of a participant and displaying it up to 4 decimal places.
const beforeAlice = await getBalance(accAlice); // This & the next line get the balance before the game starts for both Alice and Bob
const beforeBob = await getBalance(accBob);

const ctcAlice = accAlice.contract(backend); // Alice deploys the application
const ctcBob = accBob.contract(backend, ctcAlice.getInfo()); // Bob attaches to application

const HAND = ['Rock', 'Paper', 'Scissors']; // define arrays to hold the meaning of the hands and outcomes.
const OUTCOME = ['Bob wins', 'Draw', 'Alice wins'];
const Player = (Who) => ({ // defines a constructor for the player implementation
    getHand: () => { //  implement the getHand method
        const hand = Math.floor(Math.random() * 3);
        console.log(`${Who} played ${HAND[hand]}`);
        return hand;
    },
seeOutcome: (outcome) => { // implement the seeOutcome method
    console.log(`${Who} saw outcome ${OUTCOME[outcome]}`);
},
});

await Promise.all([ // waits for the backends (below) to complete
  ctcAlice.p.Alice({ // initialize a backend for alice.
    ...Player('Alice'), //implement Alice's interact object here, instantiate the implementation once for Alice and once for Bob. These are the actual objects that wil be bound to interact in the Reach program.
  wager: stdlib.parseCurrency(5), //defines Alice's wager as 5 units of the network token. This is an example of using a concrete value, rather than a fuction, in a participant interact interface.
  }),
  ctcBob.p.Bob({ //initialize a backend for Bob
    ...Player('Bob'), // implement Bob's interact object here
  acceptWager: (amt) => { // define the acceptWager function.
    console.log(`Bob accepts the wager of ${fmt(amt)}.`);
  }
  }),
]);
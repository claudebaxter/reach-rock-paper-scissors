'reach 0.1'; //indicates that this is a Reach program. You'll always have this at the top of every program.

const Player = { // define a participant interact interface that will be shared between the two players. In this case, it provides two methods: gethand, which returns a number, and seeoutcome, which receives a number.
    getHand: Fun([], UInt),
    seeOutcome: Fun([UInt], Null),
};

export const main = Reach.App(() => { //defines the main export from the program. When you compile, this is what the compiler will look at.
  const Alice = Participant('Alice', { // define Alice's interface as the Player interface, plus an integer value called wager.
    ...Player, // Specify Alice's interact interface here
    wager: UInt,
  });
  const Bob   = Participant('Bob', { //define Bob's interface as the Player interface, where he has a method called acceptWager that can look at the wager value.
    ...Player, // Specify Bob's interact interface here
    acceptWager: Fun([UInt], Null),
  }); //  use this interface for both participants. Because of this line, interact in the rest of the program will be bound to an object with methods corresponding to these actions, which will connect to the frontend of the corresponding participant.
  init(); // Marks the deployment of the reach program, which allows the program to start doing things.
  
  Alice.only(() => { // states that this block of code is something that only Alice performs.
    const wager = declassify(interact.wager); //Alice declassifies the wager for transmission
    const handAlice = declassify(interact.getHand()); //That means, the variable handAlice is known only to Alice.
  });
  Alice.publish(wager, handAlice) // Updated so that Alice shares the wager amount with Bob
    .pay(wager); // has Alice transfer the amount as part of her publication. The reach compiler would throw an exception if wager did not appear on the previous line, but did appear here.
  commit(); // Commits the state of the consensus network and returns to "local step" where individual participants can act alone.

  Bob.only(() => { // match Alice's similar local step and joining of the application through a consensus transfer publication
    interact.acceptWager(wager); //Has bob accept wager (or ignore to stall dapp/cancel operation)
    const handBob = (handAlice + 1) % 3;
  });
  Bob.publish(handBob)
    .pay(wager); //Bob pays the wager as well

  const outcome = (handAlice + (4 - handBob)) % 3; // But, this line computes the outcome of the game before committing
  require(handBob == (handAlice + 1) % 3);
  assert(outcome == 0);
  const             [forAlice, forBob] = // Computates the amounts given to each participant depending on the outcome by determing how many wager amounts each party gets. If the outcome is 2, Alice wins, then she gets two portions; while it if is 0, Bob wins, then he gets two portions; otherwise they each get one portion.
    outcome == 2 ?  [        2,     0]  : // Alice wins
    outcome == 0 ?  [        0,     2]  : // Bob wins
    /* tie */       [        1,     1];
  transfer(forAlice * wager).to(Alice); // Transfer corresponding amounts, this transfer takes place from the contract to the participants, not from the participants to each other, because all of the funds reside inside of the contract.
  transfer(forBob   * wager).to(Bob);
  commit(); // Commits the state of the application and allows the participants to see the outcome and complete.

  each([Alice, Bob], () => {
    interact.seeOutcome(outcome);
  });
});
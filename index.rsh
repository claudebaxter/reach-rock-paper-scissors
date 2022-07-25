'reach 0.1'; //indicates that this is a Reach program. You'll always have this at the top of every program.

const Player = { // define a participant interact interface that will be shared between the two players. In this case, it provides two methods: gethand, which returns a number, and seeoutcome, which receives a number.
    getHand: Fun([], UInt),
    seeOutcome: Fun([UInt], Null),
};

export const main = Reach.App(() => { //defines the main export from the program. When you compile, this is what the compiler will look at.
  const Alice = Participant('Alice', { // specify the two participants to this application, Alice and Bob.
    ...Player, // Specify Alice's interact interface here
  });
  const Bob   = Participant('Bob', {
    ...Player, // Specify Bob's interact interface here
  }); //  use this interface for both participants. Because of this line, interact in the rest of the program will be bound to an object with methods corresponding to these actions, which will connect to the frontend of the corresponding participant.
  init(); // Marks the deployment of the reach program, which allows the program to start doing things.
  // write your program here
  Alice.only(() => { // states that this block of code is something that only Alice performs.
    const handAlice = declassify(interact.getHand()); //That means, the variable handAlice is known only to Alice.
  });
  Alice.publish(handAlice); // has Alice join the application by publishing the value to the consensus network, so it can be used to evaluate the outcome of the game. Once this happens, the code is in a "consensus step" where all participants act together.
  commit(); // Commits the state of the consensus network and returns to "local step" where individual participants can act alone.

  Bob.only(() => { // match Alice's similar local step and joining of the application through a consensus transfer publication
    const handBob = declassify(interact.getHand());
  });
  Bob.publish(handBob);

  const outcome = (handAlice + (4 - handBob)) % 3; // But, this line computes the outcome of the game before committing
  commit();

  each([Alice, Bob], () => {
    interact.seeOutcome(outcome);
  });

});
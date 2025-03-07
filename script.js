const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);

const suits = [
    "Spades",
    "Diamonds",
    "Clubs",
    "Hearts"
];

class Card {
    constructor(_rank, _suit) {
        if (_rank == 11) // Convert ranked to appropriate string value
            this.rank = "J";
        else if (_rank == 12)
            this.rank = "Q";
        else if (_rank == 13)
            this.rank = "K";
        else if (_rank == 1)
            this.rank = "A";
        else
            this.rank = _rank + "";

        this.suit = suits[_suit]; // Match suit index to suits constant
        // Playing card images I found online 
        this.link = `https://tekeye.uk/playing_cards/images/svg_playing_cards/fronts/${this.suit.toLowerCase()}_${this.verboseRank().toLowerCase()}.svg`
    }
    // Rank written out if ace or face
    verboseRank = () => {
        switch (this.rank) {
            case "A":
                return "Ace";
            case "J":
                return "Jack";
            case "Q":
                return "Queen";
            case "K":
                return "King";
            default:
                return this.rank;
        }
    }
    // Rank as integer value in scoundrel
    rankNumber = () => {
        switch (this.rank) {
            case "A":
                return 14;
            case "K":
                return 13;
            case "Q":
                return 12;
            case "J":
                return 11;
            default:
                return parseInt(this.rank);
        }
    }

    toString = () => {
        return `${this.verboseRank()} of ${this.suit}`;
    }

    isFace = () => this.rank == "J" || this.rank == "Q" || this.rank == "K";
    isAce = () => this.rank == "A";
    // Filter standard deck of cards to scoundrel cards only
    scoundrelLegal = () => !((this.isFace() || this.isAce()) && (this.suit == "Hearts" || this.suit == "Diamonds"));
}
// Deck of cards object
class Deck {
    constructor() {
        this.cards = [];

        for (let s = 0; s < 4; s++) {
            for (let i = 1; i <=13; i++) {
                this.cards.push(new Card(i, s));
            }
        }
    }
    // Places card on the bottom of the deck
    bottomCard = card => this.cards.push(card);
    // Remove first card and return it
    drawCard = () => this.cards.shift();
    // Randomize deck
    shuffle = () => {
        let currentIndex = this.cards.length;
        // Algorithm based on one I found online, swap each card with a random index
        while (currentIndex != 0) {
            let randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex--;

            [this.cards[currentIndex], this.cards[randomIndex]] = [this.cards[randomIndex], this.cards[currentIndex]];
        }
    }
    // Remove red aces/faces
    filterForScoundrel = () => this.cards = this.cards.filter(c => c.scoundrelLegal());
    // Print deck contents for debugging
    print = () => this.cards.forEach((c, i) => console.log(`Card ${i + 1}: ${c.toString()}`))
}
// Simple object containing data for equipped weapon
class Weapon {
    constructor(card) {
        this.rank = card.rankNumber();
        this.lowestKill = 15;
    }
}
// Room data and game manager class
class Room {
    constructor(fightW, fightB, equip, drink, run) { // Constructor takes the player buttons to manage their state
        this.deck = new Deck(); // Set up deck
        this.deck.filterForScoundrel();
        this.deck.shuffle();

        this.cards = []; // Contains the 4 cards in the room. Populated by drawFullRoom
        this.selectedCard = null; // Currently selected card in this.cards

        this.weapon = null; // Player's equipped weapon
        // Player's buttons
        this.fightW = fightW;
        this.fightB = fightB;
        this.equip = equip;
        this.drink = drink;
        this.runbutton = run;

        this.ranFromLast = false; // The player cannot run from two rooms in a row
        this.drankPotionThisRoom = false; // The player can drink one potion per room
        // Player button event listeners
        this.fightB.addEventListener('click', this.fightBare);
        this.fightW.addEventListener('click', this.fightWeapon);
        this.drink.addEventListener('click', this.drinkPotion);
        this.equip.addEventListener('click', this.equipWeapon);
        this.runbutton.addEventListener('click', this.run);

        // All buttons but "run" disabled until corresponding card selected
        this.fightW.disabled = true;
        this.fightB.disabled = true;
        this.equip.disabled = true;
        this.drink.disabled = true;
    }
    // Fill room with 4 cards
    drawFullRoom = () => {
        while (this.cards.length < 4 && this.deck.cards.length > 0) {
            this.cards.push(this.deck.drawCard());
        }
        this.drankPotionThisRoom = false;
        this.ranFromLast = false;
        this.renderRoom();
        $("h2 > span").innerText = this.deck.cards.length;
    }
    // Remove the currently selected card from this.cards, return it, re-render room.
    removeCard = () => {
        [this.cards[0], this.cards[this.selectedCard]] = [this.cards[this.selectedCard], this.cards[0]];
        this.selectedCard = null; // Selected card is always removed, so we set it to null
        const card = this.cards.shift(); // Constant containing removed card to return after re-render
        this.renderRoom(); // Re-render room with card removed
        if (this.cards.length < 2) // If the room only contains one card, the next room begins
            this.drawFullRoom();

        this.manageButtons(null);
        if (this.cards.length <= 1 && this.deck.cards.length == 0)
            checkEndGame();

        return card;
    }
    // Generate HTML and event listeners for cards in room
    renderRoom = () => {
        const roomDiv = $("#room");
        roomDiv.innerHTML = "";

        this.cards.forEach(card => {
            roomDiv.innerHTML += `<img class="card" src="${card.link}" alt="${card.verboseRank()}_${card.suit}"/>`;
        });

        $$("#room > .card").forEach((el, i) => {
            el.addEventListener('click', () => {
                if (this.selectedCard == i) {
                    this.selectedCard = null;
                    el.classList.remove("selected");
                    this.manageButtons(null)
                }
                    
                else {
                    $$("#room > .card").forEach(iEl => iEl.classList.remove("selected"));
                    el.classList.add("selected");

                    this.selectedCard = i;
                    this.manageButtons(this.cards[this.selectedCard]);
                }
            });
        });
        this.runbutton.disabled = false;
    };

    fightBare = () => {
        modifyHealth(this.cards[this.selectedCard].rankNumber() * -1);
        this.removeCard();
    }

    fightWeapon = () => {
        const enemy = this.removeCard();
        const enemyDamage = enemy.rankNumber() * -1;
        modifyHealth(enemyDamage + this.weapon.rank < 0 ? enemyDamage + this.weapon.rank : 0);
        this.weapon.lowestKill = enemy.rankNumber();
        $("#lowest-kill").src = enemy.link;
    }

    drinkPotion = () => {
        modifyHealth(this.cards[this.selectedCard].rankNumber());
        this.removeCard();
        this.drankPotionThisRoom = true;
    }

    equipWeapon = () => {
        const weaponCard = this.removeCard();
        this.weapon = new Weapon(weaponCard);
        const img = $("#weapon");
        img.src = weaponCard.link;

        $("#lowest-kill").src = "";
    }

    run = () => {
        this.cards.forEach(card => this.deck.bottomCard(card));
        this.cards = [];

        this.drawFullRoom();
        this.ranFromLast = true;
        this.runbutton.disabled = true;
    };

    manageButtons = card => {
        this.fightB.disabled = true;
        this.fightW.disabled = true;
        this.drink.innerText = "Drink";
        this.drink.disabled = true;
        this.equip.disabled = true;
        if (card == null)
            return;

        if (card.suit == "Spades" || card.suit == "Clubs") {
            this.fightB.disabled = false;
            if (this.weapon != null) {
                if (this.weapon.lowestKill > card.rankNumber())
                    this.fightW.disabled = false;
            }
        } else if (card.suit == "Diamonds") {
            this.equip.disabled = false;
        } else if (card.suit == "Hearts") {
            if (!this.drankPotionThisRoom)
                this.drink.disabled = false;
            else if (this.cards.every(card => card.suit == "Hearts")) {
                this.drink.disabled = false;
                this.drink.innerText = "Discard";
            }
        }
    }
}

let health = 20;

const modifyHealth = value => {
    health += value

    if (health > 20)
        health = 20
    else if (health <= 0) {
        health = 0;

        

        endGame(0);
    }

    $("#hp").innerText = health;
}

const checkEndGame = (room) => {
    if (room.cards.length == 1) {
        if (health == 20 && room.cards[0].suit == "Hearts") {
            endGame(health + room.caards[0].rankNumber());
            return;
        } else {
            return;
        }
    } else {
        endGame(health);
    }
}

const endGame = score => {
    $("main").innerHTML = `<h1 class="game-over">${score == Math.abs(score) ? "VICTORY" : "GAME OVER"}</h1>
    <h2>Score: ${score}</h2>
    <button class="restart">Restart</button>`;
    $(".restart").addEventListener('click', () => location.reload());
}

const main = () => {
    $("#hp").innerText = health;
    const fightW = $("#fight-w");
    const fightB = $("#fight-b");
    const equip = $("#equip");
    const drink = $("#drink");
    const run = $("#run");

    const room = new Room(fightW, fightB, equip, drink, run);
    room.drawFullRoom();
};

addEventListener("DOMContentLoaded", main);
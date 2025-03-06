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
        if (_rank == 11)
            this.rank = "J";
        else if (_rank == 12)
            this.rank = "Q";
        else if (_rank == 13)
            this.rank = "K";
        else if (_rank == 1)
            this.rank = "A";
        else
            this.rank = _rank + "";

        this.suit = suits[_suit];

        this.link = `https://tekeye.uk/playing_cards/images/svg_playing_cards/fronts/${this.suit.toLowerCase()}_${this.verboseRank().toLowerCase()}.svg`
    }

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

    scoundrelLegal = () => !((this.isFace() || this.isAce()) && (this.suit == "Hearts" || this.suit == "Diamonds"));
}

class Deck {
    constructor() {
        this.cards = [];

        for (let s = 0; s < 4; s++) {
            for (let i = 1; i <=13; i++) {
                this.cards.push(new Card(i, s));
            }
        }
    }

    bottomCard = card => this.cards.push(card);

    drawCard = () => this.cards.shift();

    shuffle = () => {
        let currentIndex = this.cards.length;

        while (currentIndex != 0) {
            let randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex--;

            [this.cards[currentIndex], this.cards[randomIndex]] = [this.cards[randomIndex], this.cards[currentIndex]];
        }
    }

    filterForScoundrel = () => this.cards = this.cards.filter(c => c.scoundrelLegal());

    print = () => this.cards.forEach((c, i) => console.log(`Card ${i + 1}: ${c.toString()}`))
}

class Weapon {
    constructor(card) {
        this.rank = card.rankNumber();
        this.lowestKill = 15;
    }
}

class Room {
    constructor(fightW, fightB, equip, drink, run) {
        this.deck = new Deck();
        this.deck.filterForScoundrel();
        this.deck.shuffle();

        this.cards = [];
        this.selectedCard = null;

        this.weapon = null;

        this.fightW = fightW;
        this.fightB = fightB;
        this.equip = equip;
        this.drink = drink;
        this.runbutton = run;

        this.ranFromLast = false;
        this.drankPotionThisRoom = false;

        this.fightB.addEventListener('click', this.fightBare);
        this.fightW.addEventListener('click', this.fightWeapon);
        this.drink.addEventListener('click', this.drinkPotion);
        this.equip.addEventListener('click', this.equipWeapon);
        this.runbutton.addEventListener('click', this.run);

        this.fightW.disabled = true;
        this.fightB.disabled = true;
        this.equip.disabled = true;
        this.drink.disabled = true;
    }

    drawFullRoom = () => {
        while (this.cards.length < 4) {
            this.cards.push(this.deck.drawCard());
        }
        this.drankPotionThisRoom = false;
        this.renderRoom();
        $("h2 > span").innerText = this.deck.cards.length;
    }

    removeCard = () => {
        [this.cards[0], this.cards[this.selectedCard]] = [this.cards[this.selectedCard], this.cards[0]];
        this.selectedCard = null;
        const card = this.cards.shift();
        this.renderRoom();
        if (this.cards.length < 2)
            this.drawFullRoom();

        if ((!this.cards.some(card => card.suit != "Hearts")) && this.drankPotionThisRoom)
            this.drawFullRoom();

        return card;
    }

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
        this.ranFromLast = false;
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
        this.drink.disabled = true;
        this.equip.disabled = true;
        if (card.suit == "Spades" || card.suit == "Clubs") {
            this.fightB.disabled = false;
            if (this.weapon != null) {
                if (this.weapon.lowestKill > card.rankNumber())
                    this.fightW.disabled = false;
            }
        } else if (card.suit == "Diamonds") {
            this.equip.disabled = false;
        } else if (card.suit == "Hearts" && !this.drankPotionThisRoom) {
            this.drink.disabled = false;
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

        $("main").innerHTML = `<h1 class="game-over">Game Over</h1><button class="restart">Restart</button>`;
        $(".restart").addEventListener('click', () => location.reload());
    }

    $("#hp").innerText = health;
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
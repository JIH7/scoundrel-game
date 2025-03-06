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

class Room {
    constructor() {
        this.cards = [];
    }

    drawFullRoom = (deck) => {
        while (this.cards.length < 4) {
            this.cards.push(deck.drawCard());
        }
        this.renderRoom();
    }

    renderRoom = () => {
        const roomDiv = $("#room");
        roomDiv.innerHTML = "";

        this.cards.forEach(card => {
            roomDiv.innerHTML += `<img class="${card}" src="${card.link}" alt="${card.verboseRank()}_${card.suit}"/>`;
        });
    }

    run = () => {

    }
}

let health = 20;
const deck = new Deck();
const room = new Room();

const main = () => {
    deck.filterForScoundrel();
    deck.shuffle();
    room.drawFullRoom(deck);

    $("#hp").innerText = health;
};

addEventListener("DOMContentLoaded", main);